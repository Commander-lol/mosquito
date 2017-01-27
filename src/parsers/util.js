// @flow

import type { BabelNode, ClassNode, VariableDeclaration, ClassDeclaration, TypeAnnotation } from './parser.flow'

export type PossibleClassDeclaration = ClassDeclaration | VariableDeclaration

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

export function* searchDeclarations(node: BabelNode): Generator<PossibleClassDeclaration, void, void> {
	if (couldDeclareClass(node.type)) {
		yield ((node: any): PossibleClassDeclaration)
		// $FlowFixMe Symbol.iterator in an array
	} else if (node.body && node.body[Symbol.iterator]) { // Only delve into iterable bodies (generally top level,
		for (const subnode of node.body) {
			yield* searchDeclarations(subnode)
		}
	}
}

export function getClassFromDeclaration(node: BabelNode): ?ClassNode {
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

export function getConstructorParamsFromClassDeclaration(node: ClassNode): ?Array<?TypeAnnotation> {
	const bodyParts = node.body.body

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
	})

	return types
}

export function paramListCantInject(list: Array<?any>): boolean {
	return list.every(param => param == null)
}
