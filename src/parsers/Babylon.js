// @flow

import { parse } from 'babylon'
import generate from 'babel-generator'
import uuid from 'node-uuid'
import { transform } from 'babel-core'

import * as util from './util'

import type {
	BabelNode,
	ClassNode,
	BabelProgram,
} from './parser.flow'

import type { PossibleClassDeclaration } from './util'

type Options = {
	filename?: string,
	plugins?: string[],
}

type ParamList = Array<?string>

type Replacements = {
	ClassExpression(src: string, injectables: ParamList): string,
	ClassDeclaration(name: string, src: string, injectables: ParamList): string,
}

export class BabylonParser {
	source: string
	options: Options = {}
	cachedTree: ?BabelNode = null
	cachedBody: ?BabelProgram = null

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

	get tree(): BabelNode {
		if (this.cachedTree == null) {
			this.createCachedTree()
		}
		if (this.cachedTree == null) throw new Error('Parse tree was undefined after assignment')
		return this.cachedTree
	}

	createCachedTree() {
		if (this.cachedTree != null) return
		this.cachedBody = parse(this.source, this.options)
		this.cachedTree = this.cachedBody.program
	}

	getExportedClasses(): PossibleClassDeclaration[] {
		const declarations = []

		this.tree.body && this.tree.body.forEach(node => {
			for (const dec of util.searchDeclarations(node)) {
				declarations.push(dec)
			}
		})

		return declarations
	}

	transform(replacers: Replacements): string {
		const possibleDeclarations = this.getExportedClasses()
		const classes = possibleDeclarations.map(util.getClassFromDeclaration).filter(b => b != null)
		let copy = String(this.source)
		classes.sort((a, b) => (a == null || b == null) ? 0 : (a.start < b.start ? 1 : -1)).forEach(clazz => {
			if (clazz == null) return // These are already filtered out, but flow wants this for piece of mind
			const params = util.getConstructorParamsFromClassDeclaration(clazz)
			if (params == null) return
			const skip = util.paramListCantInject(params)
			if (!skip) {
				const injectables = params.map(param => (param && param.typeAnnotation) ? param.typeAnnotation.id.name : null)
				const name = clazz.id ? clazz.id.name : null
				if (name == null) return // Don't attempt to hijack anonymous classes
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
