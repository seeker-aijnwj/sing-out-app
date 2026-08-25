// Authentification et adhésion — entièrement locale pour l'instant.
//
// ⚠️ Ceci est un système d'authentification de démonstration : les mots de
// passe sont simplement hachés côté client (pas de sel, pas d'algorithme
// cryptographique robuste). Il permet de tester tout le parcours (inscription,
// connexion, paliers d'adhésion, espace admin) sans backend. Dès que Firebase
// sera branché, ce fichier devra être réécrit pour déléguer à Firebase
// Authentication — les fonctions exportées ci-dessous resteront les mêmes,
// afin que le reste de l'app n'ait rien à changer.

import { useEffect, useState } from "react";

const USERS_KEY = "singout:users";
const SESSION_KEY = "singout:session";

function uid() {
  return (crypto.randomUUID && crypto.randomUUID()) || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Hachage trivial (FNV-1a) — suffisant pour une démo locale, pas pour de la
// vraie sécurité. À remplacer par Firebase Auth.
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let listeners = [];
export function onAuthChange(fn) {
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
      /* ignore */
    }
  });
}

function readUsers() {
  return read(USERS_KEY, []);
}
function writeUsers(users) {
  write(USERS_KEY, users);
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...pub } = user;
  return pub;
}

// ---------- Session ----------

export function getCurrentUser() {
  const session = read(SESSION_KEY, null);
  if (!session) return null;
  const user = readUsers().find((u) => u.id === session.userId);
  return publicUser(user);
}

export function useCurrentUser() {
  const [user, setUser] = useState(() => getCurrentUser());
  useEffect(() => onAuthChange(() => setUser(getCurrentUser())), []);
  return user;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  notify();
}

// ---------- Inscription / connexion ----------
// Devenir membre ne demande que le formulaire ci-dessous — aucun paiement.
// C'est l'adhésion Plus/Pro (cf. requestUpgrade) qui nécessite un versement.

export function register({ email, password, prenom, nom, contact, assemblee, departement, rolePrecis }) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password || !prenom?.trim() || !nom?.trim()) {
    throw new Error("Merci de renseigner au minimum l'email, le mot de passe, le nom et le prénom.");
  }
  const users = readUsers();
  if (users.some((u) => u.email === cleanEmail)) {
    throw new Error("Un compte existe déjà avec cet email.");
  }
  const now = new Date().toISOString();
  const user = {
    id: uid(),
    email: cleanEmail,
    passwordHash: hash(password),
    prenom: prenom.trim(),
    nom: nom.trim(),
    contact: contact?.trim() || "",
    assemblee: assemblee?.trim() || "",
    departement: departement?.trim() || "",
    rolePrecis: rolePrecis?.trim() || "",
    membership: "member", // "member" | "plus" | "pro"
    membershipStatus: "active", // "active" | "pending"
    requestedTier: null,
    isAdmin: false,
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  writeUsers(users);
  write(SESSION_KEY, { userId: user.id });
  notify();
  return publicUser(user);
}

export function login(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  const users = readUsers();
  const user = users.find((u) => u.email === cleanEmail);
  if (!user || user.passwordHash !== hash(password)) {
    throw new Error("Email ou mot de passe incorrect.");
  }
  write(SESSION_KEY, { userId: user.id });
  notify();
  return publicUser(user);
}

export function updateProfile(userId, patch) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch, updatedAt: new Date().toISOString() };
  writeUsers(users);
  notify();
  return publicUser(users[idx]);
}

// ---------- Adhésion Plus / Pro ----------
// Le paiement (2000 FCFA/mois pour Plus, 5000 FCFA/mois pour Pro) se fait
// hors de l'app : la personne envoie son reçu par WhatsApp. Ici, on
// enregistre juste la demande ("pending") ; un administrateur la valide
// depuis l'espace Admin une fois le reçu vérifié.

export function requestUpgrade(userId, tier) {
  if (!["plus", "pro"].includes(tier)) throw new Error("Palier invalide.");
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], requestedTier: tier, membershipStatus: "pending", updatedAt: new Date().toISOString() };
  writeUsers(users);
  notify();
  return publicUser(users[idx]);
}

export function cancelUpgradeRequest(userId) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], requestedTier: null, membershipStatus: "active", updatedAt: new Date().toISOString() };
  writeUsers(users);
  notify();
  return publicUser(users[idx]);
}

// ---------- Administration ----------

export function getAllUsers() {
  return readUsers()
    .map(publicUser)
    .sort((a, b) => a.email.localeCompare(b.email));
}

export function approveUpgrade(userId) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  const tier = users[idx].requestedTier || users[idx].membership;
  users[idx] = { ...users[idx], membership: tier, membershipStatus: "active", requestedTier: null, updatedAt: new Date().toISOString() };
  writeUsers(users);
  notify();
  return publicUser(users[idx]);
}

export function rejectUpgrade(userId) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], requestedTier: null, membershipStatus: "active", updatedAt: new Date().toISOString() };
  writeUsers(users);
  notify();
  return publicUser(users[idx]);
}

export function setMembership(userId, membership) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], membership, membershipStatus: "active", requestedTier: null, updatedAt: new Date().toISOString() };
  writeUsers(users);
  notify();
  return publicUser(users[idx]);
}

// ---------- Niveaux d'accès ----------
// "member"  : inscrit + connecté (gratuit) — débloque Listes avancées & Statistiques.
// "plus"    : Admin, ou Membre Plus/Pro actif — débloque les fonctionnalités Chants & Collaboration.
// "pro"     : Admin, ou Membre Pro actif — réservé aux fonctionnalités à venir.

export function meetsLevel(user, level) {
  if (level === "public") return true;
  if (!user) return false;
  if (level === "member") return user.membershipStatus === "active" || user.isAdmin;
  const active = user.membershipStatus === "active" || user.isAdmin;
  if (level === "plus") return user.isAdmin || (active && (user.membership === "plus" || user.membership === "pro"));
  if (level === "pro") return user.isAdmin || (active && user.membership === "pro");
  return false;
}

export const MEMBERSHIP_LABELS = {
  member: "Membre",
  plus: "Membre Plus",
  pro: "Membre Pro",
};

export const UPGRADE_PRICE = {
  plus: "2 000 FCFA / mois",
  pro: "5 000 FCFA / mois",
};

// ---------- Comptes de démonstration ----------
// Un jeu de comptes fictifs, un par palier, pour tester les paliers d'accès
// sans attendre un vrai paiement. Voir le README pour les identifiants.

export function seedFictionalUsersIfEmpty() {
  if (readUsers().length > 0) return;
  const now = new Date().toISOString();
  const mk = (partial) => ({
    id: uid(),
    createdAt: now,
    updatedAt: now,
    membershipStatus: "active",
    requestedTier: null,
    isAdmin: false,
    contact: "",
    assemblee: "",
    departement: "",
    rolePrecis: "",
    ...partial,
  });
  writeUsers([
    mk({
      email: "admin@singout.app",
      passwordHash: hash("Admin123!"),
      prenom: "Sara",
      nom: "Koffi",
      contact: "+225 07 00 00 00 01",
      assemblee: "Assemblée Centrale",
      departement: "Louange",
      rolePrecis: "Responsable louange",
      membership: "pro",
      isAdmin: true,
    }),
    mk({
      email: "membre@singout.app",
      passwordHash: hash("Membre123!"),
      prenom: "Jean",
      nom: "N'Guessan",
      contact: "+225 07 00 00 00 02",
      assemblee: "Assemblée Centrale",
      departement: "Louange",
      rolePrecis: "Choriste",
      membership: "member",
    }),
    mk({
      email: "plus@singout.app",
      passwordHash: hash("Plus123!"),
      prenom: "Aïcha",
      nom: "Bamba",
      contact: "+225 07 00 00 00 03",
      assemblee: "Assemblée Nord",
      departement: "Louange",
      rolePrecis: "Lead vocal",
      membership: "plus",
    }),
    mk({
      email: "pro@singout.app",
      passwordHash: hash("Pro123!"),
      prenom: "Marc",
      nom: "Dibi",
      contact: "+225 07 00 00 00 04",
      assemblee: "Assemblée Centrale",
      departement: "Musique",
      rolePrecis: "Chef de chœur",
      membership: "pro",
    }),
    mk({
      email: "attente@singout.app",
      passwordHash: hash("Attente123!"),
      prenom: "Grace",
      nom: "Oura",
      contact: "+225 07 00 00 00 05",
      assemblee: "Assemblée Nord",
      departement: "Louange",
      rolePrecis: "Choriste",
      membership: "member",
      membershipStatus: "pending",
      requestedTier: "plus",
    }),
  ]);
}
