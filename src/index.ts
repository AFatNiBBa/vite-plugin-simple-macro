
import { and, FilterExpression, include, exprInterpreter } from "@rolldown/pluginutils";
import { PREREQUISITE, addSpecificFilter, VISITOR } from "./util";
import { parseAsync, PluginItem, traverse } from "@babel/core";
import { Plugin, SourceMapInput } from "rolldown";
import { generate } from "@babel/generator";
import { Context, Macro } from "./type";

// TODO: Prova se macro "A(2)" può generare macro "B()" che genera macro "A(1)" > (Testa se funziona la ricorsività delle macro)
// TODO: Usa su "font-class"? > (Almeno "ensureImport()")

export * from "./filter";
export * from "./type";

export default function macroPlugin(opts: { filter?: FilterExpression, macro: Macro[] }): Plugin {
    const { filter, macro } = opts;
    const inner = filter ? and(PREREQUISITE, filter) : PREREQUISITE;
    const outer = addSpecificFilter(macro, inner);
    return {
        name: "vite-plugin-simple-macro",
        transform: {
            order: "pre",
            filter: [ include(outer) ],
            async handler(code, id, info) {
                // TODO: Vite non supporta ancora queste cose quindi tocca ricontrollare per la dev mode > Crea issue
                // TODO: Prova a convertire in un filtro normale di vite?
                // Quelle specifiche le filtra dopo, quindi qui basta "inner", non serve "outer"
                if (!exprInterpreter(inner, code, id, info.moduleType)) return;

                const filtered = macro.filter(({ filter }) => !filter || exprInterpreter(filter, code, id, info.moduleType));
                if (!filtered.length) return;

                const plugin = [ "@babel/plugin-syntax-typescript", { isTSX: true } ] satisfies PluginItem;
                const ast = (await parseAsync(code, { filename: id, plugins: [ plugin ] }))!;
                const ctx: Context = { id, macro: filtered, changed: 0, ...info };
                traverse(ast, VISITOR, undefined, ctx);
                if (!ctx.changed) return;

                const out = generate(ast, { sourceMaps: true, sourceFileName: id });
                return { code: out.code, map: out.map as SourceMapInput };
            }
        }
    };
}