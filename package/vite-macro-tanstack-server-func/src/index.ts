
import { Macro, ensureGlobal } from "vite-plugin-simple-macro";
import { code } from "@rolldown/pluginutils";
import { dispatch } from "./lib/dispatch";
import { Framework } from "./lib/type";

export { Framework };

/**
 * Enables the {@link __server} macro.
 * If you intend to call this macro from another macro, you must pass `false` to the {@link filter} option, since the macro could not be present in the source code
 * @param framework The frontend framework to target
 * @param filter Whether to skip files that don't contain the macro
 */
export default function serverMacro(framework: Framework, filter = true): Macro {
  const name: keyof typeof globalThis = "__server";
  return {
    filter: filter ? code(name) : undefined,
    transform(call) {
      if (!ensureGlobal(call, name)) return false;      
      dispatch(call, framework, name);
      return true;
    }
  };
}