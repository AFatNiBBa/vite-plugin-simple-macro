
import { FilterExpression } from "@rolldown/pluginutils";
import { NodePath } from "@babel/traverse";
import { ModuleType } from "rolldown";
import { types } from "@babel/core";

export interface Macro {
    filter?: FilterExpression;
    
    transform(this: Context, path: NodePath<types.CallExpression>, ctx: Context, t: typeof types): boolean;
}

export interface Context {
    id: string;
    macro: Macro[];
    changed: number;
    moduleType?: ModuleType;
    ssr?: boolean;
}