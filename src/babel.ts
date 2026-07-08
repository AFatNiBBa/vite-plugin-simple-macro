
import { PluginObj } from "@babel/core";

import {
    arrowFunctionExpression,
    awaitExpression,
    blockStatement,
    callExpression,
    exportDefaultDeclaration,
    identifier,
    objectExpression,
    objectPattern,
    objectProperty,
    returnStatement,
    variableDeclaration,
    variableDeclarator,

    isImportDefaultSpecifier,
    isImportNamespaceSpecifier,
    
    ExportSpecifier,
    Identifier,
    ImportSpecifier,
    ImportDefaultSpecifier,
    ImportNamespaceSpecifier,
    ObjectProperty
} from "@babel/types";

/** Conversion constants */
const DEFAULT_INSTRUCTION = "default", CONST_INSTRUCTION = "const", IMPORT_VARIABLE = "__import";

/** Wraps a JavaScript file inside a factory function and changes each `import`/`export` accordingly */
export const BABEL_PLUGIN: PluginObj = {
    visitor: {
        /** Wraps the program inside an async lambda expression that takes {@link IMPORT_VARIABLE} as a parameter */
        Program(path) {
            const { node, node: { body, directives } } = path;
            const arg = identifier(IMPORT_VARIABLE);
            const lambda = arrowFunctionExpression([ arg ], blockStatement(body, directives), true);
            const stmt = exportDefaultDeclaration(lambda);
            node.body = [ stmt ]; // It doesn't replace the whole node in order to not make the visitor pass through it again
        },

        /** Replaces the `import`s with property accesses on {@link IMPORT_VARIABLE} */
        ImportDeclaration(path) {
            const { specifiers, source } = path.node;
            const target = getLValFromSpecifier(specifiers);
            const lib = identifier(IMPORT_VARIABLE);
            const module = awaitExpression(callExpression(lib, [ source ]));
            if (!target) return path.replaceWith(module); // Gestisce gli "import" che eseguono e basta
            const init = variableDeclarator(target, module);
            const declaration = variableDeclaration(CONST_INSTRUCTION, [ init ]);
            path.replaceWith(declaration);
        },

        /** Replaces the (Hopefully) signle `export` in a `return` statement */
        ExportNamedDeclaration(path) {
            const exports = path.node.specifiers as ExportSpecifier[];
            const props = exports.map(x => objectProperty(x.exported, x.local, undefined, (x.exported as Identifier)?.name === x.local.name));
            const obj = objectExpression(props);
            const ret = returnStatement(obj);
            path.replaceWith(ret);
        }
    }
};

/**
 * Generates the variable declarations for an `import` statement
 * @param specifier List of declarations made by an `import` statement
 */
function getLValFromSpecifier(specifier: (ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier)[]) {
    var target: ObjectProperty[] | undefined;
    for (const elm of specifier)
        if (isImportNamespaceSpecifier(elm))
            return elm.local;
        else if (isImportDefaultSpecifier(elm))
            (target ??= []).push(objectProperty(identifier(DEFAULT_INSTRUCTION), elm.local));
        else
            (target ??= []).push(objectProperty(elm.imported, elm.local, undefined, (elm.imported as Identifier)?.name === elm.local.name));
    return target && objectPattern(target!);
}