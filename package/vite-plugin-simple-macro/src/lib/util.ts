
import { and, FilterExpression, id, makeIdFiltersToMatchWithQuery, or } from "rolldown/filter";
import { Context, Macro } from "./type";
import { Visitor } from "@babel/core";

/**
 * Mandatory constraints a file should satisfy in order to be processed by the macro system.
 * I'm specifying that it's a {@link FilterExpression} because **"@microsoft/api-extractor"** would not be able to resolve the inferred type
 */
export const PREREQUISITE: FilterExpression = id(makeIdFiltersToMatchWithQuery(/\.[mc]?[tj]sx?$/));

/**
 * Expression visitor that applies the macros to call expressions.
 * Each macro gets called in order and the first one that returns `true` will stop the iteration.
 * If at least a macro returns `true` then the `changed` property of the context will be incremented
 */
export const VISITOR: Visitor<Context> = {
  CallExpression(path, ctx) {
    for (const macro of ctx.macro) {
      if (!macro.transform.call(ctx, path, ctx)) continue;
      ctx.changes++;
      break;
    }
  }
};

/**
 * Combines a general filter with the specific filters of a sequence of macros.
 * This is used to make sure that **"rolldown"** only applies the plugin to the files that need it.
 * Each file that is matched by at least one macro is included.
 * Once a file passed the check, only the macros for which the file is included will be applied to it.
 * If at least one macro has no filter, it returns {@link inner} directly, because it means that we can't assume the macro only applies to a subset of the files.
 * If {@link list} is empty, the returned filter will never match
 * @param inner The general filter that applies to all macros
 * @param list The sequence of macros whose filters will be combined with the general filter
 */
export function combineFilters(inner: FilterExpression, list: Iterable<Macro>) {
  const out: FilterExpression[] = [];
  
  for (const { filter } of list)
    if (filter)
      out.push(filter);
    else
      return inner; // Se ce n'è almeno uno senza filtro allora tocca passare da tutte le parti, perchè almeno a lui serve

  return and(inner, or(...out)); // Se non ce n'è nessuno restituisce sempre falso
}