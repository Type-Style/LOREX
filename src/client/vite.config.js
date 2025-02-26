import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const ReactCompilerConfig = { /* ... */ };

export default defineConfig({
  root: path.resolve(__dirname), 
	plugins: [
		[react(), 'babel-plugin-react-compiler', ReactCompilerConfig]
	],
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.js'),
  },
  build: {
    target: 'esnext',
		chunkSizeWarningLimit: "800kb",
    rollupOptions: {
      input: path.resolve(__dirname, 'index.tsx'),
			output: {
        entryFileNames: 'js/[name].js',  // JS files go to /js
        chunkFileNames: 'js/[name].js',  // Keep chunks simple
        assetFileNames: ({ name }) => {
          if (name && name.endsWith('.css')) {
            return 'css/[name][extname]'; // CSS files go to /css
          }
          return 'js/[name][extname]'; // Other assets (if any) go to /js
        },
      },
      onwarn(warning, warn) {
        // Suppress "Module level directives cause errors when bundled" warnings
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
          return;
        }
        warn(warning);
      },
    },
    outDir: '../../dist/httpdocs',
    //emptyOutDir: true,
  },
});
