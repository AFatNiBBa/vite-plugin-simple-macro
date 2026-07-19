
import { NodePath, types as t } from '@babel/core';

/**
 * Handles the overload of {@link __server} that invokes the input function directly
 * @param call The call expression that is being processed
 * @param clojure List of identifiers that should be captured from the client during the execution of {@link f}
 * @param f The function to invoke
 * @param framework The frontend framework to target
 */
export function invoke(call: NodePath<t.CallExpression>, clojure: t.Identifier[], f: t.ArrowFunctionExpression | t.FunctionExpression) {
  call.replaceWith(
    t.callExpression(
      t.callExpression(
        call.node.callee,
        [ f ]
      ),
      f.params = clojure
    )
  );
}