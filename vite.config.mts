
import dtsPlugin from "unplugin-dts/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [ dtsPlugin({ bundleTypes: true }) ],
    build: {
        minify: false,
        target: "ESNext",
        rollupOptions: {
            external: x => !x.match(/^(?:\.|\/|\w:)/),
        },
        lib: {
            entry: "src/index.ts",
            formats: [ "es" ],
            fileName: "index"
        }
    }
});