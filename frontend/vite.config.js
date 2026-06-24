import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  plugins: [react()],
  server: {
    port: 5173,
    proxy,
  },
});
