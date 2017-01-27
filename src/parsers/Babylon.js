// @flow

import { parse } from 'babylon'
import generate from 'babel-generator'
import uuid from 'node-uuid'
import { transform } from 'babel-core'

import * as util from './util'

type Options = {

}

export class BabylonParser {
	source: string
	options: Options = {}
	cachedTree = null
	cachedBody = null

	constructor(str: string, opts: Options = {}) {
		this.source = str
		if (! opts.hasOwnProperty('filename')) {
			opts.filename = `${uuid.v4()}.js`
		}
		this.options = {
			...opts,
			sourceType: 'module',
			plugins: [
				'flow',
				'classProperties',
			].concat(opts.plugins || [])
		}
	}

	get tree() {
		if (this.cachedTree == null) {
			this.createCachedTree()
		}
		return this.cachedTree
	}

	createCachedTree() {
		if (this.cachedTree != null) return
		this.cachedBody = parse(this.source, this.options)
		global.CachedBodies = global.CachedBodies || {}
		global.CachedBodies[this.options.filename] = this.cachedBody
		this.cachedTree = this.cachedBody.program
	}

	getExportedClasses() {
		const exports = []
		const declarations = []

		this.tree.body.forEach(node => {
			if (util.identIsExport(node.type)) {
				exports.push(node)
			} else {
				for (const dec of util.searchDeclarations(node)) {
					declarations.push(dec)
				}
			}
		})

		return declarations
	}

	getCleanSource() {
		const vars = this.getExportedClasses()
		let copy = String(this.source)
		const classes = vars.map(util.getClassFromDeclaration).filter(b => b != null)
		global.FoundVars = (global.FoundVars || []).concat(classes)
		for (const clazz of classes) {
			const types = util.getConstructorParamsFromClassDeclaration(clazz)
			const skip = util.paramListCantInject(types)
			if (!skip) {
				types.forEach(type => {
					const start = copy.substring(0, type.start)
					const end = copy.substring(type.end)
					const middle = ' '.repeat(type.end - type.start)
					copy = start + middle + end
				})
			}
		}
		return copy
	}

	transform(replacers) {
		const possibleDeclarations = this.getExportedClasses()
		const classes = possibleDeclarations.map(util.getClassFromDeclaration).filter(b => b != null)
		let copy = String(this.source)
		classes.sort((a, b) => a.start < b.start ? 1 : -1).forEach(clazz => {
			const params = util.getConstructorParamsFromClassDeclaration(clazz)
			const skip = util.paramListCantInject(params)
			if (!skip) {
				const injectables = params.map(param => param.typeAnnotation.id.name)
				const name = clazz.id ? clazz.id.name : null
				let replacement = ''
				const classCode = generate(clazz).code
				if (clazz.type === 'ClassExpression') {
					replacement = replacers.ClassExpression(classCode, injectables)
				} else if (clazz.type === 'ClassDeclaration') {
					replacement = replacers.ClassDeclaration(name, classCode, injectables)
				}
				const start = copy.substring(0, clazz.start)
				const end = copy.substring(clazz.end)

				copy = start + replacement + end
			}
		})

		return transform(copy, { plugins: [
			'transform-flow-strip-types',
			'transform-class-properties'
		] }).code
	}

}
