
import { Macro, ensureGlobal } from "vite-plugin-simple-macro";
import { code } from "@rolldown/pluginutils";

/**
 * Enables the {@link __server} macro
 * @param framework The frontend framework to target
 */
export default function serverMacro(framework: "react" | "solid" | string & {}): Macro {
  const name: keyof typeof globalThis = "__server";
  return {
    filter: code(name),
    transform(call, _, t) {
      if (!ensureGlobal(call, name)) return false;      
      const args = call.get("arguments");
      if (args.length !== 1) throw call.buildCodeFrameError(`Macro ${JSON.stringify(name)} expects exactly one argument`);
      const [ expr ] = args;
      if (!expr?.isExpression()) return false;

      const top = call.findParent(x => x.isProgram())!;      
      const idImport = top.scope.generateUidIdentifier("csf");
      const idServer = top.scope.generateUidIdentifier("srv");
      const idIsomorphic = top.scope.generateUidIdentifier("iso");
      const idClient = call.scope.generateUidIdentifier("cli"); // Unique at the call expression level because it needs to be referenced from down there
      
      const data = t.identifier("data");
      const prop = t.objectProperty(data, data, undefined, true);

      top.unshiftContainer("body", [
        t.importDeclaration(
          [ t.importSpecifier(idImport, t.identifier("createServerFn")) ],
          t.stringLiteral(`@tanstack/${framework}-start`)
        ),
        t.variableDeclaration("const", [
          t.variableDeclarator(idServer, expr.node),
          t.variableDeclarator(
            idIsomorphic,
            t.callExpression(
              t.memberExpression(
                t.callExpression(
                  idImport,
                  [
                    t.objectExpression([
                      t.objectProperty(
                        t.identifier("method"),
                        t.stringLiteral("POST")
                      )
                    ])
                  ]
                ),
                t.identifier("handler")
              ),
              [
                t.arrowFunctionExpression(
                  [ t.objectPattern([ prop ]) ],
                  t.callExpression(idServer, [ t.spreadElement(data) ])
                )
              ]
            )
          ),
          t.variableDeclarator(
            idClient,
            t.arrowFunctionExpression(
              [ t.restElement(data) ],
              t.callExpression(idIsomorphic, [ t.objectExpression([ prop ]) ])
            )
          )
        ])
      ]);

      call.replaceWith(idClient);
      return true;
    }
  };
}

// Defines the signature of the macro
declare global {

  /**
   * Macro that wraps a function so that it can be called from both the client and the server, but will only be executed on the server.
   * The generated code is compatible with TanStack Start
   * @param f The function to wrap
   */
  function __server<P extends readonly unknown[], R>(f: (...args: P) => R): (...args: P) => Promise<Awaited<R>>;
}

// Makes Babel's parent retrieval type-safe
declare module "@babel/traverse" {
  interface NodePath<T> {
    findParent<N extends Node>(callback: (path: NodePath) => path is NodePath<N>): NodePath<N> | null;
  }
}