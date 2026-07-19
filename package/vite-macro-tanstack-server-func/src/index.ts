
import { Macro, ensureGlobal } from "vite-plugin-simple-macro";
import { code } from "@rolldown/pluginutils";
import { Framework } from "./lib/type";
import { wrap } from "./lib/wrap";

export { Framework };

/**
 * Enables the {@link __server} macro
 * @param framework The frontend framework to target
 */
export default function serverMacro(framework: Framework): Macro {
  const name: keyof typeof globalThis = "__server";
  return {
    filter: code(name),
    transform(call) {
      if (!ensureGlobal(call, name)) return false;      
      const args = call.get("arguments");
      if (args.length !== 1) throw call.buildCodeFrameError(`Macro ${JSON.stringify(name)} expects exactly one argument`);
      const [ f ] = args;
      if (!f?.isExpression()) return false;
      wrap(call, f, framework);
      return true;
    }
  };
}