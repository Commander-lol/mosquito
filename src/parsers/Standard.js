// @flow

const core = require('babel-core')

import * as util from './util'

type Options = {

}

function filterPluginsList(pluginList: Array<string>) {
	return Array.from(
		new Set(
			pluginList.filter(p => p !== 'transform-flow-strip-types').concat(['syntax-flow'])
		)
	)
}

export class StandardParser {
	source: string
	options: Options = {}
	cachedTree = null
	cachedBody = null

	constructor(str: string, opts: Options = {}) {
		this.source = str
		this.options = {
			...opts,
			plugins: filterPluginsList(opts.plugins || [])
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
		this.cachedBody = core.transform(this.source, this.options).ast
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
		for (const v of vars) {
			const start = copy.substring(0, v.start)
			const end = copy.substring(v.end)
			const middle = ' '.repeat(v.end - v.start)
			copy = start + middle + end
		}
		return copy
	}

}
