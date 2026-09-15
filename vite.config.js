/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import {
    defineConfig,
    loadEnv,
} from 'vite';
import process from 'node:process';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const isDocker = Boolean(env.DOCKER_VITE_PORT || process.env.DOCKER_VITE_PORT);
    let host;
    try {
        host = env.APP_URL ? new URL(env.APP_URL).host : undefined;
    } catch {
        host = undefined;
    }

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                ssr: 'resources/js/ssr.jsx',
                refresh: true,
                detectTls: isDocker ? false : host,
            }),
            react(),
            tailwindcss(),
        ],
        esbuild: {
            jsx: 'automatic',
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: 'resources/js/tests/setup.ts',
        },
        server: isDocker
            ? {
                  host: '0.0.0.0',
                  port: parseInt(env.DOCKER_VITE_PORT || process.env.DOCKER_VITE_PORT) || 5174,
                  hmr: {
                      host: 'localhost',
                      clientPort: parseInt(env.DOCKER_VITE_PORT || process.env.DOCKER_VITE_PORT) || 5174,
                  },
                  cors: true,
              }
            : {
                  cors: true,
              },
    };
});