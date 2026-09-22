// Enregistrement du service worker + mise à jour automatique.
//
// Combiné à `skipWaiting`/`clientsClaim` (voir vite.config.js), ceci évite
// le symptôme classique des PWA après un redéploiement (ex. sur GitHub
// Pages) : une page qui reste bloquée sur l'ancienne version tant que
// l'utilisateur ne ferme/rouvre pas complètement l'app. Ici, dès qu'une
// nouvelle version est détectée, elle est activée puis la page est
// rechargée automatiquement, sans action requise.
import { registerSW } from "virtual:pwa-register";

export function initPWA() {
  try {
    const updateSW = registerSW({
      onNeedRefresh() {
        updateSW(true);
      },
      onRegisterError(error) {
        console.error("[Sing Out] Erreur d'enregistrement du service worker :", error);
      },
    });
  } catch {
    // Environnement sans service worker (ex. certains navigateurs en mode
    // privé) : l'app continue de fonctionner normalement, juste sans PWA.
  }
}
