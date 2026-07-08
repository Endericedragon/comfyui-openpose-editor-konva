import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue(), cssInjectedByJs()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    },
    build: {
        lib: {
            entry: resolve(__dirname, './src/main.ts'),
            formats: ['es'],
            fileName: 'oeKonva',
            cssFileName: "style"
        },
        rollupOptions: {
            output: {
                dir: 'web',
                entryFileNames: 'oeKonva.js',
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