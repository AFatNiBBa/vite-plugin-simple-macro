
import { NodePath, types } from "@babel/core";

/** The name of the default import/export */
const DEFAULT_IMPORT_NAME = "default";

/**
 * Makes sure that the callee of a call expression is an identifier named {@link name} and makes sure it is not shadowed by context specific identifiers.
 * It only matches raw identifiers, so accessing the macro from {@link window} (For example) is not allowed
 * @param call The call expression to check 
 * @param name The expected name of the callee
 */
export function ensureGlobal(call: NodePath<types.CallExpression>, name: string) {
  const callee = call.get("callee");
  if (!callee.isIdentifier()) return false;
  if (callee.node.name !== name) return false;
  return !call.scope.getBinding(name);
}

/**
 * Makes sure that the callee of a call expression is imported from a specific module.
 * If you don't specify {@link name}, it will check for a default import
 * @param call The call expression to check
 * @param module The expected module from which the callee is imported
 * @param name The expected name of the import
 */
export function ensureImport(call: NodePath<types.CallExpression>, module: string, name = DEFAULT_IMPORT_NAME) {
  const callee = call.get("callee");
  if (callee.isMemberExpression()) return ensureImportNamespace(callee, module, name);
  if (!callee.isIdentifier()) return false;
  const specifier = callee.scope.getBinding(callee.node.name)?.path;
  if (!specifier) return false;
  if (specifier.isImportDefaultSpecifier()) return name === DEFAULT_IMPORT_NAME && ensureModule(specifier, module);
  if (!specifier.isImportSpecifier()) return false;
  const imported = specifier.get("imported");
  if (!ensureContent(imported, name)) return false;
  return ensureModule(specifier, module);
}

/**
 * Makes sure that a member access is a property named {@link name} on a namespace import object of a specific module
 * @param member The member expression to check
 * @param module The expected module from which the namespace is generated
 * @param name The expected name of the property
 */
function ensureImportNamespace(member: NodePath<types.MemberExpression>, module: string, name: string) {
  const prop = member.get("property");
  if (!ensureContent(prop, name)) return false;
  const obj = member.get("object");
  if (!obj.isIdentifier()) return false;
  const specifier = member.scope.getBinding(obj.node.name)?.path;
  if (!specifier?.isImportNamespaceSpecifier()) return false;
  return ensureModule(specifier, module);
}

/**
 * Makes sure that an import specifier belongs to an import declaration from a specific module
 * @param specifier The import specifier to check
 * @param module The expected module from which the import is made
 */
function ensureModule(specifier: NodePath<types.ImportDeclaration["specifiers"][number]>, module: string) {
  const declaration = specifier.parentPath;
  if (!declaration.isImportDeclaration()) throw declaration.buildCodeFrameError("The parent of an import specifier should always be an import declaration");
  const source = declaration.get("source");
  return source.node.value === module;
}

/**
 * Makes sure that a property-like expression is either an identifier named {@link content} or a string literal with value {@link content}
 * @param prop The property-like expression to check
 * @param content The expected content of the expression
 */
function ensureContent(prop: NodePath<types.MemberExpression["property"]>, content: string) {
  return prop.isIdentifier() && prop.node.name === content || prop.isStringLiteral() && prop.node.value === content;
}