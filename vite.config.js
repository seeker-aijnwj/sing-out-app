import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Nom du dépôt GitHub : à adapter si le repo change de nom.
// GitHub Pages sert le site depuis https://<user>.github.io/<repo>/
const REPO_NAME = 'sing-out'

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon-32.png'],
      manifest: {
        name: 'Sing Out',
        short_name: 'Sing Out',
        description: 'Louons ensemble, partageons la parole — enregistrez, organisez et partagez vos chants.',
        theme_color: '#0F1B2E',
        background_color: '#F6F8FB',
        display: 'standalone',
        start_url: `/${REPO_NAME}/`,
        scope: `/${REPO_NAME}/`,
        orientation: 'portrait-primary',
        icons: [
          { src: 'icons/icon-48.png', sizes: '48x48', type: 'image/png' },
          { src: 'icons/icon-72.png', sizes: '72x72', type: 'image/png' },
          { src: 'icons/icon-96.png', sizes: '96x96', type: 'image/png' },
          { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icons/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        // Active immédiatement chaque nouvelle version du service worker au
        // lieu d'attendre la fermeture de tous les onglets : sans ça, un
        // redéploiement (ex. sur GitHub Pages) reste "coincé" tant que
        // l'utilisateur ne ferme ou ne rouvre pas complètement l'app.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Le SDK Firebase (chargé dynamiquement, uniquement si configuré) ne
        // doit pas être pré-mis en cache : tant qu'aucune clé Firebase n'est
        // fournie, ce code n'est jamais téléchargé ni exécuté.
        globIgnores: ['**/firebase*.js', '**/index.esm-*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /firebase|index\.esm/.test(url.pathname),
            handler: 'NetworkFirst',
            options: { cacheName: 'firebase-sdk' },
          },
        ],
      },
    }),
  ],
})
