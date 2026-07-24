
import { NodePath, t } from 'vite-plugin-simple-macro';
import { Framework } from './type';
import { invoke } from './invoke';
import { wrap } from './wrap';

/**
 * Choses whether to call {@link invoke} or {@link wrap}
 * @param call The call expression that is being processed
 * @param framework The frontend framework to target
 * @param name The name of the macro
 */
export function dispatch(call: NodePath<t.CallExpression>, framework: Framework, name: string) {
  const args = call.get("arguments");
  switch (args.length) {
    case 1:
      const [ w ] = args;
      if (!w.isExpression()) return false;
      wrap(call, w.node, framework);
      break;

    case 2:
      const [ clojure, f ] = args;
      if (!clojure.isArrayExpression())
        throw clojure.buildCodeFrameError(`Macro ${JSON.stringify(name)} expects an identifier array as the first argument`);
      
      const list: t.Identifier[] = [];
      for (const elm of clojure.get("elements"))
        if (!elm.isIdentifier())
          throw elm.buildCodeFrameError(`Macro ${JSON.stringify(name)} expects every element of the first argument to be an identifier`);
        else
          list.push(elm.node);

      if (!f.isFunctionExpression() && !f.isArrowFunctionExpression() || f.node.params.length)
        throw f.buildCodeFrameError(`Macro ${JSON.stringify(name)} expects a function with no parameters as the second argument`);

      invoke(call, list, f.node);
      break;

    default:
      throw call.buildCodeFrameError(`Macro ${JSON.stringify(name)} expects either one or two arguments`);
  }
}