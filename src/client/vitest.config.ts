import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

// React client tests only; the backend keeps its separate Jest setup (jest.config.js).
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)), // same root as vite.config.js, paths below are relative to src/client
  cacheDir: '../../node_modules/.vitest', // keep the cache out of src/client
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })], // same React Compiler as vite.config.js, so tests run the shipped code
  test: {
    environment: 'jsdom',
    environmentOptions: {
      // Relative axios URLs (e.g. "/read") resolve against this origin,
      // so tests talk to the running dev server like the real client does.
      jsdom: { url: 'http://localhost/' },
    },
    css: { include: /\.module\.css$/ }, // only CSS modules affect assertions (real scoped class names); skip processing plain stylesheets
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    // Real logins wait for bcrypt on the server; parallel test files contend for it,
    // so allow generous timeouts (slow 2-vCPU CI runners included)
    testTimeout: 45000,
    hookTimeout: 45000,
  },
});
