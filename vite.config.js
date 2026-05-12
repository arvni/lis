import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { glob } from 'glob';
import path from 'path';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        hmr: { host: 'localhost', protocol: 'ws', clientPort: 5173 },
        watch: { usePolling: true },
    },
    plugins: [
        laravel({
            input: [
                'resources/js/app.jsx',
                // Dynamically include all JSX files
                ...glob.sync('resources/js/Pages/**/*.jsx').map(file =>
                    path.resolve(__dirname, file)
                ),
            ],
            refresh: true,
        }),
        react(),
    ],
});
