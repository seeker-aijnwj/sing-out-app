// Initialisation paresseuse de Firebase.
//
// Tant qu'aucune configuration valide n'est fournie (variables d'environnement
// VITE_FIREBASE_*), ce fichier n'importe et n'initialise jamais le SDK
// Firebase : l'application continue de fonctionner entièrement en local,
// sans aucune erreur ni appel réseau.
//
// Pour brancher Firebase :
//   1. Créez un projet Firebase (console.firebase.google.com) avec Firestore activé.
//   2. Copiez `.env.example` vers `.env.local` et renseignez les valeurs
//      (Paramètres du projet → Vos applications → Config SDK).
//   3. Relancez `npm run dev` / reconstruisez le site.
// Le module src/lib/sync.js prendra alors automatiquement le relais.

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured() {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

let dbPromise = null;

// Charge le SDK Firebase (uniquement à ce moment-là — pas au démarrage de
// l'app) et renvoie une instance Firestore prête à l'emploi.
export function getFirestoreDb() {
  if (!isFirebaseConfigured()) {
    return Promise.reject(new Error("Firebase n'est pas configuré (variables VITE_FIREBASE_* manquantes)."));
  }
  if (!dbPromise) {
    dbPromise = Promise.all([import("firebase/app"), import("firebase/firestore")]).then(
      ([{ initializeApp, getApps }, { initializeFirestore, getFirestore }]) => {
        const app = getApps().length ? getApps()[0] : initializeApp(config);
        try {
          // ignoreUndefinedProperties évite un échec de TOUT le lot d'écriture
          // (batch) si un seul chant a un champ optionnel à `undefined` — par
          // exemple un champ ajouté récemment (langue, accords…) resté vide
          // sur d'anciens chants. Doit être appelé avant tout getFirestore().
          return initializeFirestore(app, { ignoreUndefinedProperties: true });
        } catch {
          // Si Firestore a déjà été initialisé ailleurs (ex. hot-reload en
          // dev), on retombe sur l'instance existante.
          return getFirestore(app);
        }
      }
    );
  }
  return dbPromise;
}
