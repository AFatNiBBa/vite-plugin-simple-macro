
import { NodePath, types } from "@babel/core";

const DEFAULT_IMPORT_NAME = "default";

export function ensureGlobal(path: NodePath<types.CallExpression>, name: string) {
    // TODO: Specifica che non chiappa "window.", ecc...
    const callee = path.get("callee");
    if (!callee.isIdentifier()) return false;
    if (callee.node.name !== name) return false;
    return !path.scope.getBinding(name); // Controlla che non sia sovrascritto localmente
}

export function ensureImport(path: NodePath<types.CallExpression>, module: string, name = DEFAULT_IMPORT_NAME) {
    const callee = path.get("callee");
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

function ensureImportNamespace(path: NodePath<types.MemberExpression>, module: string, name: string) {
    const prop = path.get("property");
    if (!ensureContent(prop, name)) return false;
    const obj = path.get("object");
    if (!obj.isIdentifier()) return false;
    const specifier = path.scope.getBinding(obj.node.name)?.path;
    if (!specifier?.isImportNamespaceSpecifier()) return false;
    return ensureModule(specifier, module);
}

function ensureModule(path: NodePath<types.ImportDeclaration["specifiers"][number]>, module: string) {
    const declaration = path.parentPath;
    if (!declaration.isImportDeclaration()) throw declaration.buildCodeFrameError("The parent of an import specifier should always be an import declaration");
    const source = declaration.get("source");
    return source.node.value === module;
}

function ensureContent(path: NodePath<types.MemberExpression["property"]>, content: string) {
    return path.isIdentifier() && path.node.name === content || path.isStringLiteral() && path.node.value === content;
}