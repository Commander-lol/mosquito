// @flow

import { version } from './version'

import type { Provider } from './Container.types'

const cloneDeep = require('lodash.clonedeep')

const containerSymbolName = `mosquito-container-${version}`
const ContainerSymbol = Symbol.for(containerSymbolName)

const cacheSymbolName = `mosquito-cache-${version}`
const CacheSymbol = Symbol.for(cacheSymbolName)

function getCache() {
	if (global[CacheSymbol] == null) {
		global[CacheSymbol] = new Map()
	}
	return global[CacheSymbol]
}

function createClass(descriptor: Provider, container: Container) {
	const params = descriptor.meta.params.map(p => container.make(p))
	return new (descriptor.resolver)(...params)
}

function resolveClass(descriptor: Provider, container: Container) {
	if (descriptor.strategy === 'singleton') {
		const cache = getCache()
		if (cache.has(descriptor.meta.name)) {
			return cache.get(descriptor.meta.name)
		} else {
			const instance = createClass(descriptor, container)
			cache.set(descriptor.meta.name, instance)
			return instance
		}
	} else {
		return createClass(descriptor, container)
	}
}

function resolveObject(descriptor: Provider) {
	if (descriptor.strategy === 'singleton') {
		return descriptor.resolver
	} else {
		return cloneDeep(descriptor.resolver)
	}
}

function resolveFunction(descriptor: Provider) {
	return descriptor.resolver()
}

function resolveLibrary(descriptor: Provider) {
	return require(descriptor.resolver)
}

class Container {
	resolutions: Map<string, Provider>
	whitelist: string[]

	get cache() {
		return getCache()
	}

	getInjectionProxy(injectables) {
		const container = this
		return {
			construct(target, params) {
				const injections = injectables.map(container.make)
				return new target(...(params.concat(injections)))
			}
		}
	}

	constructor() {
		this.resolutions = new Map()
		this.whitelist = []
	}

	get make() {
		return (ident: string) => {
			const resolution = this.resolutions.get(ident)
			if (resolution == null) {
				try {
					const module = require(ident)
					return module
				} catch (e) {
					if (e.message.startsWith('Cannot find module')) {
						throw new TypeError(`Cannot make undefined object ${ident}. If this is a local class, it needs to be bound by a provider. If this is a library injection, it may not be installed - check your package.json file.`)
					} else {
						throw e
					}
				}
			}
			if (resolution.type === 'class') {
				return resolveClass(resolution, this)
			} else if (resolution.type === 'function') {
				return resolveFunction(resolution, this)
			} else if (resolution.type === 'require') {
				return resolveLibrary(resolution, this)
			} else {
				return resolveObject(resolution, this)
			}
		}
	}

	allow(module: string) {
		this.whitelist = Array.from(new Set(this.whitelist.concat(module)))
	}

	register(key, provider) {
		this.resolutions.set(key, provider)
	}
}

if (global[ContainerSymbol] == null) {
	global[ContainerSymbol] = new Container
}

if (!global.Container) {
	Object.defineProperty(global, 'Container', { value: global[ContainerSymbol], enumerable: false, writable: false })
}

require('./modules')

export default global[ContainerSymbol]
