// Synchronisation locale → Firebase.
//
// Ce module gère tout ce qui concerne la communication avec Firebase :
//  - il ne fait strictement rien tant que Firebase n'est pas configuré
//    (voir src/lib/firebase.js) — l'app reste 100% fonctionnelle en local ;
//  - dès qu'une configuration est présente ET qu'une connexion Internet est
//    détectée, il transfère les chants et listes créés/modifiés localement
//    vers Firestore, ainsi que les suppressions ;
//  - il expose un statut ("disabled" | "offline" | "syncing" | "synced" | "error")
//    que l'UI peut afficher (voir la page Plus).
//
// La synchronisation est volontairement à sens unique (local → cloud) pour
// l'instant : cet appareil est toujours la source de vérité tant qu'aucun
// mécanisme de fusion multi-appareils n'a été conçu. Le code est structuré
// pour qu'ajouter une synchronisation descendante (cloud → local) plus tard
// n'impose pas de tout réécrire.

import { isFirebaseConfigured, getFirestoreDb } from "./firebase.js";
import { getSongsRaw, getSetsRaw, getTombstones, clearTombstone, onDataChange } from "./storage.js";

const META_KEY = "singout:sync:meta"; // { songs: {id: updatedAt}, sets: {id: updatedAt}, lastSyncAt }

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
    return { songs: {}, sets: {}, lastSyncAt: null, ...JSON.parse(localStorage.getItem(META_KEY) || "{}") };
  } catch {
    return { songs: {}, sets: {}, lastSyncAt: null };
  }
}

function writeMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function getLastSyncAt() {
  return readMeta().lastSyncAt;
}

function scheduleSync(delay = 800) {
  if (!isFirebaseConfigured()) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    syncNow();
  }, delay);
}

// Pousse vers Firestore uniquement ce qui a changé depuis le dernier envoi
// réussi (comparaison sur `updatedAt`), plus les suppressions en attente.
export async function syncNow() {
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
// les événements réseau et sur les changements de données locales.
export function initSync() {
  if (initialized) return;
  initialized = true;

  if (!isFirebaseConfigured()) {
    setStatus("disabled");
    return;
  }

  window.addEventListener("online", () => scheduleSync(200));
  window.addEventListener("offline", () => setStatus("offline"));
  onDataChange(() => scheduleSync());

  if (typeof navigator !== "undefined" && navigator.onLine) {
    scheduleSync(1000);
  } else {
    setStatus("offline");
  }
}
