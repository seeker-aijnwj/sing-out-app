// Couche de persistance locale (localStorage).
// Pensée pour être remplacée plus tard par une vraie API / synchronisation
// (cf. section "Étendre plus tard" du README) sans changer les composants :
// il suffira de réécrire ce fichier en gardant les mêmes fonctions exportées.

import { getCurrentUser } from "./auth.js";

const SONGS_KEY = "singout:songs";
const SETS_KEY = "singout:sets";
const SEEDED_KEY = "singout:seeded";
const TOMBSTONES_KEY = "singout:tombstones";
const TEMPLATES_KEY = "singout:templates";
const COMMENTS_KEY = "singout:comments";

function uid() {
  return (crypto.randomUUID && crypto.randomUUID()) || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Normalisation d'un titre pour comparer deux chants indépendamment de la
// casse, des espaces superflus et des espaces multiples — utilisé pour
// empêcher les doublons, en local comme pendant la synchronisation.
function normalizeTitle(title) {
  return (title || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Associe discrètement l'auteur connecté à un nouveau chant/liste, sans
// rien casser si personne n'est connecté (fonctionnalités de base = hors
// connexion).
function authorStamp() {
  const user = getCurrentUser();
  if (!user) return {};
  return { createdBy: user.id, createdByName: `${user.prenom} ${user.nom}` };
}

// ---------- Notifications de changement ----------
// Permet à d'autres modules (ex. src/lib/sync.js) de réagir à toute
// modification locale sans que cette couche ait besoin de les connaître.

let listeners = [];

export function onDataChange(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* un listener défaillant ne doit pas casser l'app */
    }
  });
}

// ---------- Suppressions en attente (pour la synchronisation) ----------
// Quand un chant ou une liste est supprimé localement, on garde une trace
// légère de son id pour pouvoir répercuter la suppression sur Firebase
// dès qu'une connexion sera disponible.

function readTombstones() {
  try {
    return { songs: [], sets: [], ...JSON.parse(localStorage.getItem(TOMBSTONES_KEY) || "{}") };
  } catch {
    return { songs: [], sets: [] };
  }
}

function addTombstone(type, id) {
  const t = readTombstones();
  if (!t[type].includes(id)) t[type].push(id);
  write(TOMBSTONES_KEY, t);
}

export function getTombstones() {
  return readTombstones();
}

export function clearTombstone(type, id) {
  const t = readTombstones();
  t[type] = t[type].filter((x) => x !== id);
  write(TOMBSTONES_KEY, t);
}

// ---------- Chants ----------

export function getSongs() {
  return read(SONGS_KEY).sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

// Lecture non triée, pour la synchronisation (ordre non pertinent).
export function getSongsRaw() {
  return read(SONGS_KEY);
}

// Insère/actualise un chant reçu de Firestore, sans jamais écraser une
// version locale plus récente ni ressusciter un chant supprimé localement
// en attente de propagation (tombstone). Contrairement à saveSong(), ne
// déclenche pas de nouvel envoi vers le cloud (le document est déjà là-bas).
// Si un chant local porte déjà le même titre (créé indépendamment sur un
// autre appareil, donc avec un id différent), on ne crée pas de doublon :
// on garde la version la plus récente sous l'id déjà présent localement, et
// on renvoie l'id "perdant" pour que l'appelant (sync.js) puisse supprimer
// le document Firestore devenu orphelin.
export function upsertSongFromRemote(remote) {
  if (!remote?.id || !remote?.title) return { song: null, discardedId: null };
  if (readTombstones().songs.includes(remote.id)) return { song: null, discardedId: null };
  const songs = read(SONGS_KEY);
  const idx = songs.findIndex((s) => s.id === remote.id);

  if (idx === -1) {
    const titleClashIdx = songs.findIndex((s) => normalizeTitle(s.title) === normalizeTitle(remote.title));
    if (titleClashIdx !== -1) {
      if ((remote.updatedAt || "") > (songs[titleClashIdx].updatedAt || "")) {
        songs[titleClashIdx] = { ...remote, id: songs[titleClashIdx].id };
        write(SONGS_KEY, songs);
        notify();
      }
      return { song: songs[titleClashIdx], discardedId: remote.id };
    }
    songs.push(remote);
  } else if ((remote.updatedAt || "") > (songs[idx].updatedAt || "")) {
    songs[idx] = remote;
  } else {
    return { song: songs[idx], discardedId: null };
  }
  write(SONGS_KEY, songs);
  notify();
  return { song: remote, discardedId: null };
}

export function getSong(id) {
  return read(SONGS_KEY).find((s) => s.id === id) || null;
}

export function saveSong(song) {
  const songs = read(SONGS_KEY);
  const now = new Date().toISOString();
  if (song.title !== undefined) {
    const clash = songs.find(
      (s) => s.id !== song.id && normalizeTitle(s.title) === normalizeTitle(song.title)
    );
    if (clash) throw new Error(`Un chant intitulé « ${clash.title} » existe déjà.`);
  }
  if (song.id) {
    const idx = songs.findIndex((s) => s.id === song.id);
    const updated = { ...songs[idx], ...song, updatedAt: now };
    if (idx >= 0) songs[idx] = updated;
    else songs.push(updated);
    write(SONGS_KEY, songs);
    notify();
    return updated;
  }
  const created = { favorite: false, tags: [], chords: "", language: "Français", draft: false, isComposition: false, composer: "", ...song, id: uid(), createdAt: now, updatedAt: now, ...authorStamp() };
  songs.push(created);
  write(SONGS_KEY, songs);
  notify();
  return created;
}

export function toggleFavorite(id) {
  const songs = read(SONGS_KEY);
  const idx = songs.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  songs[idx] = { ...songs[idx], favorite: !songs[idx].favorite, updatedAt: new Date().toISOString() };
  write(SONGS_KEY, songs);
  notify();
  return songs[idx];
}

// ---------- Import de chants ----------
// Réservé aux Membres Plus/Pro/Admin côté UI. Accepte un tableau d'objets
// { title, category?, originalKey?, youtubeUrl?, notes?, tags?, chords?, lyrics? }
// — le même format que celui utilisé pour l'export/les fichiers d'exemple
// (voir alpha-chants.json). Les doublons de titre (insensible à la casse)
// sont ignorés pour éviter les imports répétés par erreur.

export function importSongs(list) {
  if (!Array.isArray(list)) throw new Error("Format invalide : un tableau de chants est attendu.");
  const existingTitles = new Set(getSongsRaw().map((s) => s.title.trim().toLowerCase()));
  let imported = 0;
  let skipped = 0;
  for (const entry of list) {
    const title = entry?.title?.trim();
    if (!title) {
      skipped++;
      continue;
    }
    if (existingTitles.has(title.toLowerCase())) {
      skipped++;
      continue;
    }
    saveSong({
      title,
      category: entry.category?.trim() || "",
      originalKey: entry.originalKey?.trim() || "",
      youtubeUrl: entry.youtubeUrl?.trim() || "",
      notes: entry.notes?.trim() || "",
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      chords: entry.chords?.trim() || "",
      language: entry.language?.trim() || "Français",
      lyrics:
        Array.isArray(entry.lyrics) && entry.lyrics.length
          ? entry.lyrics.map((v) => ({ id: v.id || uid(), label: v.label || "", text: v.text || "" }))
          : [{ id: uid(), label: "", text: "" }],
    });
    existingTitles.add(title.toLowerCase());
    imported++;
  }
  return { imported, skipped };
}

export function deleteSong(id) {
  write(SONGS_KEY, read(SONGS_KEY).filter((s) => s.id !== id));
  // On retire aussi le chant des listes qui le référencent, sans les casser.
  const sets = read(SETS_KEY).map((set) => ({
    ...set,
    moments: set.moments.map((m) => ({
      ...m,
      items: m.items.filter((it) => it.songId !== id),
    })),
  }));
  write(SETS_KEY, sets);
  addTombstone("songs", id);
  notify();
}

export function duplicateSong(id) {
  const original = getSong(id);
  if (!original) return null;
  const now = new Date().toISOString();
  let title = `Copie de ${original.title}`;
  const songs = read(SONGS_KEY);
  // Garantit l'unicité du titre même si "Copie de X" existe déjà.
  let n = 2;
  while (songs.some((s) => normalizeTitle(s.title) === normalizeTitle(title))) {
    title = `Copie de ${original.title} (${n})`;
    n++;
  }
  const duplicated = {
    ...original,
    id: uid(),
    title,
    favorite: false,
    createdAt: now,
    updatedAt: now,
    lyrics: (original.lyrics || []).map((v) => ({ ...v, id: uid() })),
    ...authorStamp(),
  };
  songs.push(duplicated);
  write(SONGS_KEY, songs);
  notify();
  return duplicated;
}

// ---------- Actions groupées (sélection multiple) ----------
// Réservées aux Membres Plus/Pro/Admin côté UI (voir Songs.jsx / Sets.jsx).

export function deleteSongs(ids) {
  ids.forEach((id) => deleteSong(id));
}

export function duplicateSongs(ids) {
  return ids.map((id) => duplicateSong(id)).filter(Boolean);
}

export function setSongsDraft(ids, draft) {
  const songs = read(SONGS_KEY);
  const idSet = new Set(ids);
  const now = new Date().toISOString();
  const updated = songs.map((s) => (idSet.has(s.id) ? { ...s, draft, updatedAt: now } : s));
  write(SONGS_KEY, updated);
  notify();
}

// ---------- Listes de chants (sets) ----------

export function getSets() {
  return read(SETS_KEY).sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.createdAt?.localeCompare(a.createdAt));
}

// Lecture non triée, pour la synchronisation.
export function getSetsRaw() {
  return read(SETS_KEY);
}

// Voir upsertSongFromRemote() ci-dessus pour la logique de fusion.
export function upsertSetFromRemote(remote) {
  if (!remote?.id || !remote?.title) return null;
  if (readTombstones().sets.includes(remote.id)) return null;
  const sets = read(SETS_KEY);
  const idx = sets.findIndex((s) => s.id === remote.id);
  if (idx === -1) {
    sets.push(remote);
  } else if ((remote.updatedAt || "") > (sets[idx].updatedAt || "")) {
    sets[idx] = remote;
  } else {
    return sets[idx];
  }
  write(SETS_KEY, sets);
  notify();
  return remote;
}

export function getSet(id) {
  return read(SETS_KEY).find((s) => s.id === id) || null;
}

export function saveSet(set) {
  const sets = read(SETS_KEY);
  const now = new Date().toISOString();
  if (set.id) {
    const idx = sets.findIndex((s) => s.id === set.id);
    const updated = { ...sets[idx], ...set, updatedAt: now };
    if (idx >= 0) sets[idx] = updated;
    else sets.push(updated);
    write(SETS_KEY, sets);
    notify();
    return updated;
  }
  const created = { draft: false, ...set, id: uid(), createdAt: now, updatedAt: now, ...authorStamp() };
  sets.push(created);
  write(SETS_KEY, sets);
  notify();
  return created;
}

export function duplicateSet(id) {
  const original = getSet(id);
  if (!original) return null;
  const now = new Date().toISOString();
  const duplicated = {
    ...original,
    id: uid(),
    title: `Copie de ${original.title}`,
    date: "",
    createdAt: now,
    updatedAt: now,
    moments: original.moments.map((m) => ({
      ...m,
      id: uid(),
      items: m.items.map((it) => ({ ...it, id: uid() })),
    })),
  };
  const sets = read(SETS_KEY);
  sets.push(duplicated);
  write(SETS_KEY, sets);
  notify();
  return duplicated;
}

export function deleteSet(id) {
  write(SETS_KEY, read(SETS_KEY).filter((s) => s.id !== id));
  addTombstone("sets", id);
  notify();
}

export function deleteSets(ids) {
  ids.forEach((id) => deleteSet(id));
}

export function duplicateSets(ids) {
  return ids.map((id) => duplicateSet(id)).filter(Boolean);
}

export function setSetsDraft(ids, draft) {
  const sets = read(SETS_KEY);
  const idSet = new Set(ids);
  const now = new Date().toISOString();
  const updated = sets.map((s) => (idSet.has(s.id) ? { ...s, draft, updatedAt: now } : s));
  write(SETS_KEY, updated);
  notify();
}

export function newId() {
  return uid();
}

// ---------- Historique d'interprétation ----------
// Reconstruit, à partir de toutes les listes, le journal complet des
// interprétations : chant, liste, date, moment, lead et gamme utilisés.
// Sert à la fois à la fiche d'un chant et à la page Statistiques.

export function getAllPerformances() {
  const sets = getSets();
  const performances = [];
  for (const set of sets) {
    for (const moment of set.moments || []) {
      for (const item of moment.items || []) {
        if (!item.songId) continue;
        performances.push({
          id: item.id,
          songId: item.songId,
          setId: set.id,
          setTitle: set.title,
          date: set.date || "",
          momentName: moment.name,
          lead: item.lead?.trim() || "",
          key: item.key?.trim() || "",
        });
      }
    }
  }
  return performances.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export function getSongHistory(songId) {
  return getAllPerformances().filter((p) => p.songId === songId);
}

// ---------- Modèles de moments ----------
// Un modèle mémorise juste la structure d'une liste (noms de moments +
// numérotation), pas son contenu, pour être réutilisé à chaque nouvelle
// liste sans tout retaper.

export function getTemplates() {
  return read(TEMPLATES_KEY).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function saveTemplate(template) {
  const templates = read(TEMPLATES_KEY);
  const now = new Date().toISOString();
  if (template.id) {
    const idx = templates.findIndex((t) => t.id === template.id);
    const updated = { ...templates[idx], ...template, updatedAt: now };
    if (idx >= 0) templates[idx] = updated;
    else templates.push(updated);
    write(TEMPLATES_KEY, templates);
    notify();
    return updated;
  }
  const created = { ...template, id: uid(), createdAt: now, updatedAt: now };
  templates.push(created);
  write(TEMPLATES_KEY, templates);
  notify();
  return created;
}

export function deleteTemplate(id) {
  write(TEMPLATES_KEY, read(TEMPLATES_KEY).filter((t) => t.id !== id));
  notify();
}

// ---------- Notes d'équipe (commentaires sur un chant) ----------
// Fonctionnalité de collaboration : les membres Plus/Pro peuvent laisser
// des remarques sur un chant (arrangement, tempo, historique...).

export function getComments(songId) {
  return read(COMMENTS_KEY, [])
    .filter((c) => c.songId === songId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addComment(songId, text) {
  const user = getCurrentUser();
  if (!user) throw new Error("Connectez-vous pour ajouter une note.");
  const comments = read(COMMENTS_KEY, []);
  const comment = {
    id: uid(),
    songId,
    text: text.trim(),
    authorId: user.id,
    authorName: `${user.prenom} ${user.nom}`,
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  write(COMMENTS_KEY, comments);
  notify();
  return comment;
}

export function deleteComment(id) {
  write(COMMENTS_KEY, read(COMMENTS_KEY, []).filter((c) => c.id !== id));
  notify();
}

// ---------- Ma progression (notes personnelles sur un chant) ----------
// Contrairement aux notes d'équipe (partagées), ceci est un journal privé :
// chaque membre Plus/Pro/Admin ne voit que ses propres entrées, pour se
// souvenir plus tard de comment il/elle joue un chant (technique, capo,
// façon de le sentir...).

const PROGRESS_KEY = "singout:progress";

export function getProgressNotes(songId, userId) {
  return read(PROGRESS_KEY, [])
    .filter((p) => p.songId === songId && p.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addProgressNote(songId, text, level) {
  const user = getCurrentUser();
  if (!user) throw new Error("Connectez-vous pour enregistrer votre progression.");
  const notes = read(PROGRESS_KEY, []);
  const note = {
    id: uid(),
    songId,
    userId: user.id,
    text: text.trim(),
    level: level || "",
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  write(PROGRESS_KEY, notes);
  notify();
  return note;
}

export function deleteProgressNote(id) {
  write(PROGRESS_KEY, read(PROGRESS_KEY, []).filter((p) => p.id !== id));
  notify();
}

// ---------- Suggestions (envoyées par e-mail, cf. Preorder) ----------
// Réservé aux Membres Plus/Pro/Admin : une remarque ou idée d'amélioration,
// gardée en local (visible par l'admin) et envoyée par e-mail comme pour
// une précommande.

const SUGGESTIONS_KEY = "singout:suggestions";

export function getSuggestions() {
  return read(SUGGESTIONS_KEY, [])
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveSuggestion(data) {
  const user = getCurrentUser();
  const suggestions = read(SUGGESTIONS_KEY, []);
  const entry = {
    id: uid(),
    authorName: user ? `${user.prenom} ${user.nom}` : data.name?.trim() || "Anonyme",
    authorEmail: user?.email || data.email?.trim() || "",
    message: data.message?.trim() || "",
    createdAt: new Date().toISOString(),
  };
  suggestions.push(entry);
  write(SUGGESTIONS_KEY, suggestions);
  notify();
  return entry;
}

// ---------- Données de démonstration ----------
// Injectées une seule fois au tout premier lancement pour que l'app ne
// s'ouvre jamais totalement vide (repris des chants fournis en exemple).

export function seedIfEmpty() {
  if (localStorage.getItem(SEEDED_KEY)) return;
  localStorage.setItem(SEEDED_KEY, "1");
  if (read(SONGS_KEY).length > 0) return;

  const now = new Date().toISOString();
  const mk = (partial) => ({ id: uid(), createdAt: now, updatedAt: now, category: "", youtubeUrl: "", originalKey: "", favorite: false, tags: [], chords: "", language: "Français", ...partial });

  const songs = [
    mk({
      title: "Ouvre mes yeux Saint-Esprit",
      category: "Recueillement",
      favorite: true,
      lyrics: [
        { id: uid(), label: "V1", text: "Saint Esprit,\nAgis encore\nAgis encore\nDans ma vie" },
        { id: uid(), label: "V2", text: "Ouvre mes yeux\nPour que je vois\nJésus assis sur le Trône" },
      ],
    }),
    mk({
      title: "Car Il est bon",
      category: "Début de culte (reggae)",
      lyrics: [
        { id: uid(), label: "", text: "Car Il est bon et Sa miséricorde dure à toujours\nTout joyeux, bénissons le Seigneur" },
      ],
    }),
    mk({
      title: "Oui, je Le vois",
      category: "Recueillement",
      youtubeUrl: "https://youtu.be/-RFlJr6FdGk?si=eTVT3aVCoxx3I-Wc",
      lyrics: [{ id: uid(), label: "", text: "" }],
    }),
    mk({
      title: "Je vois le Roi",
      category: "Recueillement",
      youtubeUrl: "https://youtu.be/w26eGh_JPa8?si=rdcoghXCdq_ER7aq",
      lyrics: [{ id: uid(), label: "", text: "" }],
    }),
    mk({
      title: "Christ est élevé",
      category: "Recueillement",
      youtubeUrl: "https://youtu.be/MCSFIh3lTdk?si=xnrZMiPv85_Dwaeu",
      lyrics: [{ id: uid(), label: "", text: "" }],
    }),
    mk({ title: "À Toi la gloire Ô Ressuscité", category: "Animation", lyrics: [{ id: uid(), label: "", text: "" }] }),
    mk({ title: "Il n'a point changé", category: "Animation", lyrics: [{ id: uid(), label: "", text: "" }] }),
    mk({ title: "Wanté Gnankan", category: "Animation", lyrics: [{ id: uid(), label: "", text: "" }] }),
    mk({ title: "Kawan ooo", category: "Animation", lyrics: [{ id: uid(), label: "", text: "" }] }),
    mk({ title: "Comment ne pas Te louer", category: "Animation", lyrics: [{ id: uid(), label: "", text: "" }] }),
  ];
  write(SONGS_KEY, songs);

  const byTitle = (t) => songs.find((s) => s.title === t);
  const set = {
    id: uid(),
    title: "Culte du dimanche",
    date: "2026-05-31",
    createdAt: now,
    updatedAt: now,
    moments: [
      {
        id: uid(),
        name: "Début de culte (reggae)",
        numbered: false,
        items: [{ id: uid(), songId: byTitle("Car Il est bon").id }],
      },
      {
        id: uid(),
        name: "Recueillement",
        numbered: false,
        items: [
          { id: uid(), songId: byTitle("Oui, je Le vois").id, lead: "Aïcha", key: "Sol" },
          { id: uid(), songId: byTitle("Je vois le Roi").id, lead: "Aïcha", key: "Ré" },
          { id: uid(), songId: byTitle("Christ est élevé").id, lead: "Marc", key: "La" },
        ],
      },
      {
        id: uid(),
        name: "Sainte Cène",
        numbered: false,
        items: [{ id: uid(), text: "Selon le message" }],
      },
      {
        id: uid(),
        name: "Animation",
        numbered: true,
        items: [
          { id: uid(), songId: byTitle("À Toi la gloire Ô Ressuscité").id },
          { id: uid(), songId: byTitle("Il n'a point changé").id },
          { id: uid(), songId: byTitle("Wanté Gnankan").id },
          { id: uid(), songId: byTitle("Kawan ooo").id },
          { id: uid(), songId: byTitle("Comment ne pas Te louer").id },
        ],
      },
    ],
  };
  write(SETS_KEY, [set]);

  write(TEMPLATES_KEY, [
    {
      id: uid(),
      name: "Culte du dimanche",
      createdAt: now,
      updatedAt: now,
      moments: [
        { name: "Début de culte", numbered: false },
        { name: "Recueillement", numbered: false },
        { name: "Sainte Cène", numbered: false },
        { name: "Animation", numbered: true },
      ],
    },
  ]);

  notify();
}

// ---------- Précommandes v1.0.0 ----------
// Formulaire public (pas besoin d'être connecté) : la personne précommande,
// la demande est gardée en local pour que l'admin la retrouve dans l'app
// même hors-ligne, et un e-mail est proposé en parallèle (voir Preorder.jsx).

const PREORDERS_KEY = "singout:preorders";

export function getPreorders() {
  return read(PREORDERS_KEY, [])
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function savePreorder(data) {
  const preorders = read(PREORDERS_KEY, []);
  const entry = {
    id: uid(),
    nom: data.nom?.trim() || "",
    prenom: data.prenom?.trim() || "",
    email: data.email?.trim() || "",
    contact: data.contact?.trim() || "",
    assemblee: data.assemblee?.trim() || "",
    tailleEquipe: data.tailleEquipe?.trim() || "",
    message: data.message?.trim() || "",
    createdAt: new Date().toISOString(),
  };
  preorders.push(entry);
  write(PREORDERS_KEY, preorders);
  notify();
  return entry;
}
