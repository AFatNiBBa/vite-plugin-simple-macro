
import { and, FilterExpression, id, makeIdFiltersToMatchWithQuery, or } from "@rolldown/pluginutils";
import { types, Visitor } from "@babel/core";
import { Context, Macro } from "./type";

// TODO:                   ↓ Senza questo da i warning quando buildi
export const PREREQUISITE: FilterExpression = id(makeIdFiltersToMatchWithQuery(/\.[mc]?[tj]sx?$/));

export const VISITOR: Visitor<Context> = {
    CallExpression(path, ctx) {
        for (const macro of ctx.macro) {
            if (!macro.transform.call(ctx, path, ctx, types)) continue;
            ctx.changed++;
            break;
        }
    }
};

export function addSpecificFilter(macro: Iterable<Macro>, inner: FilterExpression) {
    const out: FilterExpression[] = [];
    
    for (const { filter } of macro)
        if (filter)
            out.push(filter);
        else
            return inner; // Se ce n'è almeno uno senza filtro allora tocca passare da tutte le parti, perchè almeno a lui serve

    return and(inner, or(...out)); // Se non ce n'è nessuno restituisce sempre falso
}