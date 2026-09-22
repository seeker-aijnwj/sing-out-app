# Sing Out

Une PWA (Progressive Web App) React pour enregistrer, modifier, supprimer et partager des chants — et des listes de chants pour un culte ou un rassemblement — vers WhatsApp, Telegram ou tout autre canal.

- **Accueil** : recherche rapide (chants + listes), actions rapides, statistiques (nombre de chants, de listes, chant le plus interprété), prochaine liste programmée, favoris, chants ajoutés récemment.
- **Chants** : titre, catégorie, gamme originelle, paroles organisées en couplets/refrains, lien vidéo, notes, favoris. Chaque chant s'affiche comme un message (bulle) prêt à être partagé, avec son **historique d'interprétation** (dans quelles listes, à quelle date, avec quel lead et dans quelle gamme). **Mode présentation** plein écran, texte agrandi, pour lire les paroles pendant qu'on chante.
- **Listes de chants** : regroupent des chants (ou du texte libre, exemple « Selon le message ») par moment (Début de culte, Recueillement, Sainte Cène, Animation… ) avec des moments numérotés ou non. Pour chaque chant d'une liste, on précise le **lead** et la **gamme** utilisés.
    - **Modèles de structure** : enregistrez la structure d'une liste (noms des moments + numérotation) pour la réutiliser en un clic à chaque nouvelle liste.
    - **Suggestions** : lors de l'ajout d'un chant à un moment, les chants jamais chantés ou pas repris depuis longtemps remontent en tête, avec une petite 💡.
    - **Calendrier** : bascule Liste/Calendrier pour visualiser les listes programmées sur un mois.
    - **Dupliquer** une liste (pratique pour les cultes récurrents), **imprimer / exporter en PDF** (bouton Imprimer → « Enregistrer en PDF » dans la boîte de dialogue du navigateur).
- **Statistiques** (page dédiée, depuis Plus) : chants les plus interprétés, classement des leads, gammes les plus utilisées, et chants oubliés (jamais chantés ou pas repris depuis 60 jours).
- **Partage** : bouton « Partager » sur un chant ou une liste → ouvre WhatsApp, Telegram, le partage natif du système, ou copie le texte formaté dans le presse-papiers.
- **Apparence** : mode clair / sombre, au choix depuis la page Plus.
- **Plus** : statistiques, apparence, état de la synchronisation Firebase, et futures commandes.
- **Hors-ligne** : installable comme une app (PWA), fonctionne sans connexion une fois chargée. Les données sont stockées localement sur l'appareil (`localStorage`).
- **Synchronisation Firebase (prête à brancher)** : dès que vous fournissez une configuration Firebase (voir plus bas), les chants et listes créés ou modifiés en local sont automatiquement transférés vers Firestore dès qu'une connexion Internet est détectée — suppressions comprises. Tant qu'aucune configuration n'est fournie, l'app reste 100 % locale, sans aucun appel réseau vers Firebase.

Pensée pour être étendue plus tard sans tout réécrire : voir `src/lib/storage.js` (données), `src/lib/sync.js` (synchronisation), `src/lib/theme.js` (apparence), `src/pages/Plus.jsx` (nouvelles commandes).

## Développer en local

```bash
npm install
npm run dev
```

## Construire pour la production

```bash
npm run build
npm run preview   # pour tester le build localement
```

## Brancher Firebase

1. Créez un projet Firebase (console.firebase.google.com) avec **Firestore** activé.
2. Copiez `.env.example` vers `.env.local` et renseignez les valeurs (Paramètres du projet → Vos applications → Config SDK).
3. Relancez `npm run dev` (ou reconstruisez) : la page **Plus** affiche alors l'état de la synchronisation.
4. Pour le déploiement automatique (GitHub Actions), ajoutez les mêmes valeurs comme *secrets* du dépôt : `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` — le workflow `.github/workflows/deploy.yml` les utilise déjà.
5. Pensez à configurer des règles de sécurité Firestore adaptées (par défaut, un projet Firebase tout neuf refuse toute lecture/écriture).

Tant que ces variables sont absentes, aucune erreur : l'app continue de fonctionner entièrement en local.

## Déployer sur GitHub Pages

Le projet est déjà configuré pour GitHub Pages (routage en `HashRouter`, donc pas besoin d'un `404.html` de secours ; base URL calculée depuis le nom du dépôt).

**Option A — Déploiement automatique (recommandé)**

Un workflow GitHub Actions est fourni dans `.github/workflows/deploy.yml`.

1. Poussez ce projet sur un dépôt GitHub (ex. `sing-out-app`).
2. Dans le dépôt : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. Si le nom du dépôt n'est **pas** `sing-out-app`, ouvrez `vite.config.js` et changez la constante `REPO_NAME` en haut du fichier pour qu'elle corresponde exactement au nom du dépôt.
4. (Optionnel) Ajoutez les secrets Firebase au dépôt (voir ci-dessus) si vous voulez que le site déployé se synchronise.
5. À chaque `push` sur `gh-pages`, le site est reconstruit et publié automatiquement sur `https://<votre-utilisateur>.github.io/sing-out-app/`.

**Option B — Déploiement manuel**

```bash
npm run build
npx gh-pages -d dist
```

Puis activez GitHub Pages sur la branche `gh-pages` dans les paramètres du dépôt.

## Étendre plus tard

- La couche de données est isolée dans `src/lib/storage.js` : toutes les fonctions (`getSongs`, `saveSong`, `getSets`, `saveSet`, etc.) peuvent être réécrites pour appeler une vraie API sans changer les composants qui les utilisent. Elle expose aussi `onDataChange(fn)`, un petit système d'abonnement utilisé par la synchronisation (et par les pages pour rester à jour en temps réel).
- Le formatage du texte partagé est isolé dans `src/lib/share.js`.
- La synchronisation Firebase est isolée dans `src/lib/firebase.js` (initialisation) et `src/lib/sync.js` (logique). Pour l'instant, elle est unidirectionnelle (local → cloud) ; le code est structuré pour qu'ajouter une synchronisation descendante (cloud → local, multi-appareils) plus tard n'impose pas de tout réécrire.
- Icônes et manifeste PWA dans `public/icons/` et `vite.config.js` (bloc `VitePWA`).

## ✅ Fonctionnalités implémentées

### Socle (sans connexion, hors-ligne)
| Fonctionnalité    | Détail                                                                                                                     |
|-------------------|----------------------------------------------------------------------------------------------------------------------------|
| Chants            | Créer / modifier / supprimer, titre, catégorie, gamme originelle, paroles en couplets/refrains, lien vidéo, notes, favoris |
| Listes de chants  | Créer / modifier / supprimer, moments personnalisés, numérotation, lead + gamme par chant                                  |
| Partage           | WhatsApp, Telegram, partage natif, copie presse-papiers (chant et liste)                                                   |
| Accueil           | Recherche rapide, actions rapides, stats express, prochaine liste, favoris, ajouts récents                                 |
| Mode présentation | Plein écran, texte agrandi/réduit, pour lire pendant qu'on chante                                                          |
| Apparence         | Mode clair / sombre                                                                                                        |
| PWA               | Installable, fonctionne hors-ligne, données en local                                                                       |

### Réservé aux Membres connectés (inscription gratuite)
- Modèles de structure de liste (charger / enregistrer)
- Suggestions de chants (chants oubliés remontés en priorité)
- Vue calendrier mensuel des listes
- Duplication de liste
- Impression / export PDF d'une liste
- Page Statistiques (chants les + interprétés, classement leads, gammes utilisées, chants oubliés)

### Réservé aux Membres Plus / Pro / Admin
- Étiquettes libres sur les chants
- Recherche dans les paroles
- Champ Accords par chant
- Notes d'équipe (commentaires collaboratifs, avec auteur et date)
- Attribution automatique « Ajouté par… » sur chants et listes

### Adhésion et administration
- Inscription complète (email, mot de passe, prénom, nom, contact, assemblée, département, rôle précis)
- Connexion / déconnexion / édition du profil
- 3 paliers : Membre (gratuit), Membre Plus (2000 FCFA/mois), Membre Pro (5000 FCFA/mois)
- Demande d'adhésion payante → statut « en attente » → validation manuelle par un admin
- Espace Admin : voir les demandes en attente, valider/refuser, changer le palier de n'importe quel membre
- 5 comptes fictifs prêts à l'emploi pour tester chaque palier

### Infrastructure technique
- Module de synchronisation Firebase (push local → Firestore dès qu'une connexion est détectée, suppressions comprises), inactif tant qu'aucune clé n'est fournie
- Déploiement GitHub Pages automatisé (GitHub Actions), avec support des secrets Firebase
- Design cohérent, thème clair/sombre, structure de code documentée pour être reprise facilement

---

## 🚧 Ce qui reste à faire

### Court terme, pour finaliser ce qui existe
- **Brancher Firebase pour de vrai** et tester la synchronisation en conditions réelles (vous l'avez prévu comme prochaine étape)
- **Migrer l'authentification locale vers Firebase Authentication** — le système actuel fonctionne pour tester, mais n'est pas sécurisé pour une mise en production (mots de passe faiblement hachés, pas de vérification d'email, pas de récupération de mot de passe)
- **Numéro WhatsApp réel** à intégrer dans les instructions de paiement (actuellement "sera communiqué")
- Recevoir et vérifier un vrai reçu de paiement avant validation admin (le flux existe, il manque le contact réel)

### Fonctionnalités déjà évoquées, mais non construites
- **Pièces jointes** (partition/PDF) sur un chant
- **Import en masse** de chants (coller plusieurs titres/paroles d'un coup)
- **Modèles de liste avec chants par défaut**, pas juste la structure
- **Mode présentation pour une liste entière** (enchaîner les chants sans revenir en arrière)
- **Export/import JSON** de secours (utile avant de généraliser Firebase)
- **Lien public en lecture seule** d'une liste (nécessite une vraie lecture cloud, pas juste la synchro push actuelle)
- **Notifications** (nouvelle liste publiée, demande d'adhésion à valider, etc.)
- **Synchronisation descendante** (cloud → local) pour un vrai usage multi-appareils/multi-utilisateurs — actuellement la synchro est à sens unique (cet appareil est source de vérité)
- **Filtrage par période** sur la page Statistiques (ce mois / cette année / tout)
- **Fonctionnalités réservées aux Membres Pro** : le gating technique existe déjà (niveau `"pro"` prêt dans `AccessGate`), mais aucune fonctionnalité concrète n'y a encore été affectée — à définir ensemble

### Sécurité et robustesse (à ne pas négliger avant une mise en production)
- Règles de sécurité Firestore (lecture/écriture)
- Vraie gestion des mots de passe (Firebase Auth s'en charge nativement)
- Gestion des conflits en cas de modifications simultanées depuis plusieurs appareils, une fois la synchro bidirectionnelle en place

---

**En résumé** : la base fonctionnelle et les trois paliers d'accès sont solides et testés ; la suite naturelle est de brancher Firebase (données + authentification), puis de décider ensemble ce qui ira dans le palier Pro pour vos futures fonctionnalités.

