
import { transformAsync, TransformOptions } from "@babel/core";
import { BABEL_PLUGIN } from "./babel";
import { Plugin } from "vite";

/** Babel config */
const BABEL_CONFIG: TransformOptions = { plugins: [ BABEL_PLUGIN ] };

/** Wraps each JavaScript file inside a factory function */
const FACTORY_PLUGIN: Plugin = {
    name: "vite-plugin-simple-macro",
    enforce: "post",
    
    async generateBundle(_, bundle) {
        for (const file of Object.values(bundle))
            if (file.type === "chunk")
                file.code = await transformAsync(file.code, BABEL_CONFIG).then(x => x!.code!);
    }
};

export default FACTORY_PLUGIN;