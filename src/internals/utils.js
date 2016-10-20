// @flow

import esprima from 'esprima'

export function getClassDeclaration(clazz: Class<*>) {
	const src = clazz.prototype.constructor.toString()
	const tree = esprima.parse(src)
	return tree.body.filter(elem => elem.type === 'ClassDeclaration')
}

export function getConstructorTree(clazz: Class<*>) {
	const dec = getClassDeclaration(clazz)[0].body.body
	const constructor = dec.filter(i => i.type === 'MethodDefinition' && i.kind === 'constructor')[0]
	return constructor
}