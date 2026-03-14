import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    },
    build: {
        lib: {
            entry: resolve(__dirname, './src/main.ts'),
            formats: ['es'],
            fileName: 'main',
            cssFileName: "style"
        },
        rollupOptions: {
            output: {
                dir: 'web',
                entryFileNames: 'main.js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name][extname]'
            }
        },
        sourcemap: true,
        emptyOutDir: true,
        minify: false
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production')
    }
})