import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import mkcert from 'vite-plugin-mkcert';

// The backend (FastAPI) runs on http://localhost:8000 in dev.
// Proxy the API prefixes so the SPA and API share an origin during development.
const backendTarget = 'http://localhost:8000';
const apiPrefixes = ['/auth', '/colaborador', '/ponto', '/empresa', '/relatorio'];

const proxy = Object.fromEntries(
  apiPrefixes.map((prefix) => [
    prefix,
    { target: backendTarget, changeOrigin: true },
  ]),
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // mkcert: serve dev over HTTPS with a locally-trusted cert. Required so the
    // kiosk camera (getUserMedia) and the PWA service worker work on a phone over
    // LAN — browsers only grant a "secure context" to https:// or localhost.
    // Install the generated root CA on the phone once (see README/LAN notes).
    mkcert(),
    react(),
    // PWA: installable totem. When launched from the home screen it opens
    // straight into the kiosk (/kiosk) in standalone (fullscreen-like) mode.
    VitePWA({
      registerType: 'autoUpdate',
      // Generate the SW + manifest in dev too, so the install prompt and
      // standalone launch can be tested with `vite dev`, not only the build.
      devOptions: { enabled: true },
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'FaceClock — Totem',
        short_name: 'FaceClock',
        description: 'Bater ponto por reconhecimento facial (totem).',
        lang: 'pt-BR',
        // Launch straight into the kiosk screen when installed.
        start_url: '/kiosk',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f4f5f7', // --color-bg
        theme_color: '#2563eb', // --color-primary
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the built SPA shell. Never cache API calls — punches and
        // recognition must always hit the live backend.
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: apiPrefixes.map(
          (p) => new RegExp(`^${p}`),
        ),
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    // Listen on all interfaces so a phone on the same Wi-Fi can reach the dev
    // server at https://<PC-LAN-IP>:5173. mkcert provides the HTTPS cert.
    host: true,
    port: 5173,
    // The phone loads the SPA from the LAN IP; the proxy below still forwards API
    // calls to the backend on THIS machine (localhost:8000), so the phone never
    // needs the backend address directly.
    proxy,
  },
});
