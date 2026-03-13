import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import vueDevTools from "vite-plugin-vue-devtools"
// import pkg from "./package.json" with {type: "json"};

// const VDITOR_VERSION = pkg.dependencies["vditor"].match(/\d+\.\d+\.\d/g)[0];

const outputDirectory = "web";

export default defineConfig({
    plugins: [
        vue(),
        vueDevTools()
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
        },
    },
    build: {
        // lib: {
        //     entry: "./src/main.ts",
        //     formats: ["es"],
        //     fileName: "main"
        // },
        rollupOptions: {
            external: [
                // "../../../scripts/app.js",
                // "../../../scripts/api.js",
                // "../../../scripts/domWidget.js",
                // "../../../scripts/utils.js",
                // "vue",
                // "vue-i18n",
                // /^primevue\/?.*/,
                // /^@primevue\/themes\/?.*/
            ],
            output: {
                dir: outputDirectory,
                assetFileNames: "assets/[name].[ext]",
                entryFileNames: "main.js",
            }
        },
        outDir: outputDirectory,
        sourcemap: false,
        assetsInlineLimit: 30000,
        cssCodeSplit: false,
        chunkSizeWarningLimit: 1024,
    },
    // define: {
    //     "__VDITOR_VERSION__": JSON.stringify(VDITOR_VERSION)
    // }
})