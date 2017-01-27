// @flow

export function couldDeclareClass(ident: string) {
	return ident === 'VariableDeclaration'
		|| ident === 'ClassDeclaration'
}

export function identIsExport(ident: string) {
	return ident === 'ExportNamedDeclaration'
		|| ident === 'ExportSpecifier'
		|| ident === 'ExportDefaultDeclaration'
		|| ident === 'ExportAllDeclaration'
}

export function* searchDeclarations(node) {
	if (couldDeclareClass(node.type)) {
		yield node
	} else if (node.body && node.body[Symbol.iterator]) { // Only delve into iterable bodies (generally top level,
		for (const subnode of node.body) {
			yield* searchDeclarations(subnode)
		}
	}
}

export function getClassFromDeclaration(node) {
	if (node.type === 'ClassDeclaration') {
		return node
	} else if (node.type === 'VariableDeclaration') {
		return node.declarations.reduce((c, dec) => {
			if (c == null) {
				return (dec.init && dec.init.type === 'ClassExpression') ? dec.init : null
			}
			return null
		}, null)
	}
	return null
}

export function getConstructorParamsFromClassDeclaration(node) {
	const bodyParts = node.body.body

	global.LastNode = node

	const constructor = bodyParts.reduce((c, dec) => {
		if (c == null) {
			return (dec.kind && dec.kind === 'constructor') ? dec : null
		}
		return c
	}, null)

	if (constructor == null) return null
	const types = []
	constructor.params.forEach(param => {
		if (param.typeAnnotation) {
			types.push(param.typeAnnotation)
		} else {
			types.push(null)
		}
	}, null)

	return types
}

export function paramListCantInject(list) {
	return list.every(param => param == null)
}
