// Synchronisation locale ↔ Firebase.
//
// Ce module gère tout ce qui concerne la communication avec Firebase :
//  - il ne fait strictement rien tant que Firebase n'est pas configuré
//    (voir src/lib/firebase.js) — l'app reste 100% fonctionnelle en local ;
//  - dès qu'une configuration est présente ET qu'une connexion Internet est
//    détectée, il transfère les chants et listes créés/modifiés localement
//    vers Firestore, ainsi que les suppressions (push) ;
//  - au démarrage et sur demande manuelle, il rapatrie aussi ce qui existe
//    dans Firestore mais pas encore sur cet appareil (pull) — c'est ce qui
//    permet à un nouvel appareil (ou une nouvelle installation, ex. après un
//    déploiement) de retrouver les chants/listes déjà créés ailleurs ;
//  - il expose un statut ("disabled" | "offline" | "syncing" | "synced" | "error")
//    que l'UI peut afficher (voir la page Plus).
//
// La fusion pull utilise un simple "dernier écrit gagne" sur `updatedAt` et
// ne ressuscite jamais un élément supprimé localement (voir les tombstones
// dans storage.js). Ce n'est pas une synchronisation multi-appareils
// complète avec résolution de conflits fine — c'est volontairement simple
// pour la v1, mais suffisant pour que tout le monde voie la même bibliothèque.

import { isFirebaseConfigured, getFirestoreDb } from "./firebase.js";
import {
  getSongsRaw,
  getSetsRaw,
  getTombstones,
  clearTombstone,
  onDataChange,
  upsertSongFromRemote,
  upsertSetFromRemote,
} from "./storage.js";

const META_KEY = "singout:sync:meta"; // { songs: {id: updatedAt}, sets: {id: updatedAt}, lastSyncAt, lastPullAt }

let status = isFirebaseConfigured() ? "idle" : "disabled";
let statusListeners = [];
let debounceTimer = null;
let syncing = false;
let initialized = false;

function setStatus(next) {
  status = next;
  statusListeners.forEach((fn) => fn(status));
}

export function getSyncStatus() {
  return status;
}

export function onSyncStatusChange(fn) {
  statusListeners.push(fn);
  fn(status);
  return () => {
    statusListeners = statusListeners.filter((f) => f !== fn);
  };
}

function readMeta() {
  try {
    return {
      songs: {},
      sets: {},
      lastSyncAt: null,
      lastPullAt: null,
      ...JSON.parse(localStorage.getItem(META_KEY) || "{}"),
    };
  } catch {
    return { songs: {}, sets: {}, lastSyncAt: null, lastPullAt: null };
  }
}

function writeMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function getLastSyncAt() {
  return readMeta().lastSyncAt;
}

function scheduleSync(delay = 800, opts) {
  if (!isFirebaseConfigured()) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    syncNow(opts);
  }, delay);
}

// Rapatrie depuis Firestore tout ce qui n'existe pas encore ici, ou qui y a
// été modifié plus récemment qu'en local. N'écrase jamais une modification
// locale plus récente, et ne ressuscite pas un élément supprimé localement.
//
// Si deux appareils ont créé un chant du même titre indépendamment (donc
// avec deux ids différents), un seul est conservé (voir
// upsertSongFromRemote côté storage.js) : le document Firestore de l'id
// perdant est alors supprimé ici pour qu'il n'y ait bien qu'un seul chant
// de ce titre en base, quel que soit le compte qui a synchronisé.
async function pullFromCloud(db) {
  const { collection, getDocs, doc, writeBatch } = await import("firebase/firestore");
  const meta = readMeta();
  const discardedSongIds = [];

  const songsSnap = await getDocs(collection(db, "songs"));
  songsSnap.forEach((docSnap) => {
    const remote = docSnap.data();
    const { song: merged, discardedId } = upsertSongFromRemote(remote);
    if (merged) meta.songs[merged.id] = merged.updatedAt;
    if (discardedId) discardedSongIds.push(discardedId);
  });

  const setsSnap = await getDocs(collection(db, "sets"));
  setsSnap.forEach((docSnap) => {
    const remote = docSnap.data();
    const merged = upsertSetFromRemote(remote);
    if (merged) meta.sets[remote.id] = merged.updatedAt;
  });

  if (discardedSongIds.length > 0) {
    const cleanupBatch = writeBatch(db);
    discardedSongIds.forEach((id) => {
      cleanupBatch.delete(doc(db, "songs", id));
      delete meta.songs[id];
    });
    try {
      await cleanupBatch.commit();
    } catch (err) {
      // Pas grave si ça échoue (ex. permissions) : le doublon restera en
      // base mais n'apparaîtra plus en local sur aucun appareil grâce à la
      // fusion par titre — juste un peu de ménage en moins.
      console.warn("[Sing Out] Nettoyage des doublons Firestore impossible :", err);
    }
  }

  meta.lastPullAt = new Date().toISOString();
  writeMeta(meta);
}

// Pousse vers Firestore uniquement ce qui a changé depuis le dernier envoi
// réussi (comparaison sur `updatedAt`), plus les suppressions en attente.
// Avec { pull: true }, rapatrie d'abord ce qui manque localement (voir
// pullFromCloud ci-dessus) — utilisé au démarrage et sur demande manuelle.
export async function syncNow({ pull = false } = {}) {
  if (!isFirebaseConfigured()) {
    setStatus("disabled");
    return { ok: false, reason: "disabled" };
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus("offline");
    return { ok: false, reason: "offline" };
  }
  if (syncing) return { ok: false, reason: "already-syncing" };

  syncing = true;
  setStatus("syncing");
  try {
    const db = await getFirestoreDb();
    const { doc, writeBatch } = await import("firebase/firestore");

    if (pull) {
      await pullFromCloud(db);
    }

    const meta = readMeta();
    const batch = writeBatch(db);
    let ops = 0;

    for (const song of getSongsRaw()) {
      if (meta.songs[song.id] === song.updatedAt) continue;
      batch.set(doc(db, "songs", song.id), song);
      meta.songs[song.id] = song.updatedAt;
      ops++;
    }
    for (const set of getSetsRaw()) {
      if (meta.sets[set.id] === set.updatedAt) continue;
      batch.set(doc(db, "sets", set.id), set);
      meta.sets[set.id] = set.updatedAt;
      ops++;
    }

    const tombstones = getTombstones();
    for (const id of tombstones.songs) {
      batch.delete(doc(db, "songs", id));
      delete meta.songs[id];
      ops++;
    }
    for (const id of tombstones.sets) {
      batch.delete(doc(db, "sets", id));
      delete meta.sets[id];
      ops++;
    }

    if (ops > 0) await batch.commit();

    tombstones.songs.forEach((id) => clearTombstone("songs", id));
    tombstones.sets.forEach((id) => clearTombstone("sets", id));

    meta.lastSyncAt = new Date().toISOString();
    writeMeta(meta);
    setStatus("synced");
    return { ok: true, ops };
  } catch (err) {
    console.error("[Sing Out] Échec de synchronisation Firebase :", err);
    setStatus("error");
    return { ok: false, reason: "error", error: err };
  } finally {
    syncing = false;
  }
}

// À appeler une fois au démarrage de l'app (voir App.jsx). Se branche sur
// les événements réseau et sur les changements de données locales, et
// rapatrie une première fois ce qui existe déjà dans le cloud.
export function initSync() {
  if (initialized) return;
  initialized = true;

  if (!isFirebaseConfigured()) {
    setStatus("disabled");
    return;
  }

  window.addEventListener("online", () => scheduleSync(200, { pull: true }));
  window.addEventListener("offline", () => setStatus("offline"));
  onDataChange(() => scheduleSync());

  if (typeof navigator !== "undefined" && navigator.onLine) {
    scheduleSync(300, { pull: true });
  } else {
    setStatus("offline");
  }
}
