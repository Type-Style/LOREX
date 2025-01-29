import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({}) => {

    return {
        plugins: [
            react(),
            tsconfigPaths(),
        ],
        build: {
            rollupOptions: {
                output: {
                    dir: `dist/httpdocs/js`,
                    file: "bundle.js"
                },
            },
        },
        esbuild: { legalComments: 'none' },
    };
});

