import { defineConfig } from 'vite';

// Naija Open World - Vite configuration.
//
// `host: true` binds the dev server to 0.0.0.0 so the sandbox preview proxy
// (https://<port>-<sandbox>.e2b.app) can reach it, and `allowedHosts: true`
// lets the proxy's Host header through Vite's host check.
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    cors: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
  },
});
