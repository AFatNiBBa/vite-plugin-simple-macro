
import dtsPlugin from "unplugin-dts/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    dtsPlugin({
      include: [ "src" ], // Needed since when I turned the project into a monorepo
      bundleTypes: true
    })
  ],
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