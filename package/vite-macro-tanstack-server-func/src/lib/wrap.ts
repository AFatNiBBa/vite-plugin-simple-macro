
import { NodePath, types as t } from '@babel/core';
import { Framework } from './type';

/**
 * Handles the overload of {@link __server} that wraps the input function
 * @param call The call expression that is being processed
 * @param f The function being wrapped
 * @param framework The frontend framework to target
 */
export function wrap(call: NodePath<t.CallExpression>, f: t.Expression, framework: Framework) {
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
      t.variableDeclarator(idServer, f),
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
}