
import { FilterExpression } from "rolldown/filter";
import { NodePath } from "@babel/traverse";
import { ModuleType } from "rolldown";
import { types } from "@babel/core";

/** The settings for the macro plugin */
export interface Options {

  /** Filter that determines whether some files should be outright excluded from pre-processing */
  filter?: FilterExpression;
  
  /** The list of available macros to apply */
  macro: Macro[];
}

/** Context shared by all macros of the same file */
export interface Context {

  /** The identifier of the file that is currently being pre-processed */
  id: string;

  /** The list of available macros to apply */
  macro: Macro[];

  /** The number of changes made by the macros in the current file */
  changes: number;

  /** The module type of the current file, if available */
  moduleType?: ModuleType;

  /** The SSR mode in which the current file is currently being processed */
  ssr?: boolean;
}

/** A single macro */
export interface Macro {

  /** Filter that determines whether this macro should be applied to a certain file */
  filter?: FilterExpression;
  
  /**
   * Tries to apply the macro to a call expression.
   * If the current macro wasn't applied, the next ones will be tried
   * @param this The same object passed as {@link ctx}
   * @param call The call expression that is being processed
   * @param ctx The context of the file that is currently being pre-processed
   * @param t The {@link types} object, provided as a parameter for convenience
   * @returns `true` if the macro was applied, `false` otherwise
   */
  transform(this: Context, call: NodePath<types.CallExpression>, ctx: Context, t: typeof types): boolean;
}