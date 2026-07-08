
import { and, FilterExpression, id, include, makeIdFiltersToMatchWithQuery, exprInterpreter, or } from "@rolldown/pluginutils";
import { parseAsync, PluginItem, traverse, types, Visitor } from "@babel/core";
import { Plugin, SourceMapInput } from "rolldown";
import { generate } from "@babel/generator";
import { Context, Macro } from "./type";

export * from "./type";

const PREREQUISITE = id(makeIdFiltersToMatchWithQuery(/\.[mc]?[tj]sx?$/));

const VISITOR: Visitor<Context> = {
    CallExpression(path, ctx) {
        for (const macro of ctx.macro) {
            if (!macro.transform.call(ctx, path, ctx, types)) continue;
            ctx.changed++;
            break;
        }
    }
};

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
                // Quelle specifiche le filtra dopo, quindi qui basta "outer", non serve "inner"
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

function addSpecificFilter(macro: Iterable<Macro>, inner: FilterExpression) {
    const out: FilterExpression[] = [];
    
    for (const { filter } of macro)
        if (filter)
            out.push(filter);
        else
            return inner; // Se ce n'è almeno uno senza filtro allora tocca passare da tutte le parti, perchè almeno a lui serve

    return and(inner, or(...out));
}