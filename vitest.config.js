import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Standalone config for Vitest (no laravel-vite-plugin, which expects a
// Laravel request context). Mirrors the app's `@/` and `ziggy-js` aliases.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            'ziggy-js': path.resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/test/setup.js'],
        include: ['resources/js/**/*.{test,spec}.{js,jsx}'],
        css: false,
        restoreMocks: true,
        // Pre-bundle heavy deps (MUI/emotion) so collect doesn't transform
        // their huge module graphs file-by-file (~100s -> seconds).
        deps: {
            optimizer: {
                web: {
                    enabled: true,
                    include: [
                        '@mui/material',
                        '@mui/icons-material',
                        '@mui/system',
                        '@emotion/react',
                        '@emotion/styled',
                    ],
                },
            },
        },
    },
});
