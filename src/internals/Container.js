// @flow

import { version } from './version'

import type {Injectables, LanguageMap, RestrictedKey} from './Container.types'

const symbolName = `mosquito-container-${version}`
const Sym = Symbol.for(symbolName)

class Container {

	_deps: Map<any, any>

	static createConstructorTrap(injectables: Injectables) {
		return {
			
		}
	}
	
	constructor() {
		this._deps = new Map()
	}

	language: LanguageMap = {
		inject: 'inject',
		expose: 'expose',
	}

	make(key: any, ...params: array<any>) {
		const clazz = this._deps.get(key)
		
	}

	register(key, value) {
		this._deps.set(key, value)
	}


	registerAll(mappings: Object) {
		for (const key in mappings) {
			if (mappings.hasOwnProperty(key)) {
				this.register(key, mappings[key])
			}
		}
	}

	registerMarked(clazz: Named) {
		const name = clazz.ClassName
		this.register(name, clazz)
	}
}

if (global[Sym] == null) {
	global[Sym] = new Container
}

export default global[Sym]