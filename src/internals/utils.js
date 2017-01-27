// @flow

import { parse } from 'babylon'

export function getClassDeclaration(clazz: Class<any>) {
	const src = clazz.prototype.constructor.toString()
	const tree = parse(src)
	const { program } = tree
	return program.body.filter(node => node.type === 'ClassDeclaration')
}

// import estraverse from 'estraverse'
//
// export function getClassDeclaration(clazz: Class<*>) {
// 	const src = clazz.prototype.constructor.toString()
// 	const tree = esprima.parse(src)
// 	return tree.body.filter(elem => elem.type === 'ClassDeclaration')
// }
//
// export function getConstructorTree(clazz: Class<*>) {
// 	const dec = getClassDeclaration(clazz)[0].body.body
// 	const constructor = dec.filter(i => i.type === 'MethodDefinition' && i.kind === 'constructor')[0]
// 	return constructor
// }
//
// const replacements = {
// 	'ClassMethod': 'MethodDefinition',
// 	'ObjectProperty': 'Property',
// 	'ObjectMethod': 'Property',
// 	'StringLiteral': 'Literal',
// 	'NumericLiteral': 'Literal',
// 	'BooleanLiteral': 'Literal',
// 	'NullLiteral': 'Literal',
// 	'RegExpLiteral': 'Literal',
// }
