import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { Features } from "lightningcss";
import path from "path";

export default defineConfig({
    plugins: [react(), viteSingleFile()],
    base: "./",
    server: {
        port: 3000,
    },
    build: {
        // Change the output directory from 'dist' to 'build'
        outDir: "build",
        emptyOutDir: true,
    },
    css: {
        lightningcss: {
            exclude: Features.Colors,
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
});
