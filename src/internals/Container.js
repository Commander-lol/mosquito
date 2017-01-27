// @flow

import { version } from './version'

import type { Provider } from './Container.types'

const cloneDeep = require('lodash.clonedeep')
const uuid = require('node-uuid')

const containerSymbolName = `mosquito-container-${version}`
const ContainerSymbol = Symbol.for(containerSymbolName)

const cacheSymbolName = `mosquito-cache-${version}`
const CacheSymbol = Symbol.for(cacheSymbolName)

import { ServiceProvider } from './ServiceProvider'

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
	contexts: Map<string, Container>

	constructor() {
		this.resolutions = new Map()
		this.whitelist = []
		this.contexts = new Map()
	}

	get cache() {
		return getCache()
	}

	getInjectionProxy(injectables) {
		let container = this
		return {
			get(target, prop) {
				if (prop === '$$_Mosquito') {
					return true
				} else {
					return Reflect.get(target, prop)
				}
			},
			construct: (function(container, target, params) {
				if (target.$$_Run_In_Instantiated_Context) {
					container = container.getContextualised(target.$$_Run_In_Instantiated_Context)
				}
				const injections = injectables.map(container.make.bind(container))
				return new target(...(params.concat(injections)))
			}).bind(null, container)
		}
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

	clone() {
		const newContainer = new Container()
		newContainer.resolutions = new Map(this.resolutions)
		newContainer.whitelist = Array.from(this.whitelist)
		newContainer.contexts = new Map(this.contexts)

		return newContainer
	}

	getContextualised(id) {
		return this.contexts.get(id)
	}

	resolveInContext(clazz, bindings, run) {
		const contextId = uuid.v4()
		clazz.$$_Run_In_Instantiated_Context = contextId

		let newContext = this.clone()
		let contextProvider = new ServiceProvider()
		this.contexts.set(contextId, newContext)
		contextProvider.registerWith(newContext, bindings)

		run()

		delete clazz.$$_Run_In_Instantiated_Context
		this.contexts.delete(contextId)
		newContext = null
		contextProvider = null
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
