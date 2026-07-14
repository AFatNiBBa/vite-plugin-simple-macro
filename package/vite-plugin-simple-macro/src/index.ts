
import { and, exprInterpreter, include } from "rolldown/filter";
import { combineFilters, PREREQUISITE, VISITOR } from "./util";
import { parseAsync, PluginItem, traverse } from "@babel/core";
import { Plugin, SourceMapInput } from "rolldown";
import { generate } from "@babel/generator";
import { Context, Options } from "./type";

export * from "./filter";
export * from "./type";

// TODO: Use "ensureImport()" in "font-class" instead of checking by hand
// TODO: "readMe.md"

/**
 * Creates an instance of the macro plugin with the specified options and macros
 * @param opts The settings for the plugin
 */
export default function macroPlugin(opts: Options): Plugin {
  const { filter, macro } = opts;
  const inner = filter ? and(PREREQUISITE, filter) : PREREQUISITE;
  const outer = combineFilters(inner, macro);
  return {
    name: "vite-plugin-simple-macro",
    transform: {
      order: "pre",
      filter: [ include(outer) ],
      async handler(code, id, info) {
        // TODO: https://github.com/vitejs/vite/issues/21956
        // Specific macros are filtered afterwards, so "inner" is enough here, I don't need "outer"
        if (!exprInterpreter(inner, code, id, info.moduleType)) return;

        const filtered = macro.filter(({ filter }) => !filter || exprInterpreter(filter, code, id, info.moduleType));
        if (!filtered.length) return;

        const plugin = [ "@babel/plugin-syntax-typescript", { isTSX: true } ] satisfies PluginItem;
        const ast = (await parseAsync(code, { filename: id, plugins: [ plugin ] }))!;
        const ctx: Context = { id, macro: filtered, changes: 0, ...info };
        traverse(ast, VISITOR, undefined, ctx);
        if (!ctx.changes) return;

        const out = generate(ast, { sourceMaps: true, sourceFileName: id });
        return { code: out.code, map: out.map as SourceMapInput };
      }
    }
  };
}