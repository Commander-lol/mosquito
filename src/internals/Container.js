// @flow

import { version } from './version'

import type { Provider } from './Container.types'

const cloneDeep = require('lodash.clonedeep')
const uuid = require('node-uuid')

const containerSymbolName = `mosquito-container-${version}`
const ContainerSymbol = Symbol.for(containerSymbolName)

const cacheSymbolName = `mosquito-cache-${version}`
const CacheSymbol = Symbol.for(cacheSymbolName)

import { ServiceProvider,  } from './ServiceProvider'
import type { BuilderFunction } from './ServiceProvider'

type Closure = () => void
type Cache = Map<string, Object>
function getCache(): Cache {
	if (global[CacheSymbol] == null) {
		global[CacheSymbol] = new Map()
	}
	return global[CacheSymbol]
}

function createClass(descriptor: Provider) {
	return new (descriptor.resolver)()
}

function resolveClass(descriptor: Provider) {
	if (descriptor.strategy === 'singleton') {
		const cache = getCache()
		if (cache.has(descriptor.meta.name)) {
			return cache.get(descriptor.meta.name)
		} else {
			const instance = createClass(descriptor)
			cache.set(descriptor.meta.name, instance)
			return instance
		}
	} else {
		return createClass(descriptor)
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

export class Container {
	resolutions: Map<string, Provider>
	whitelist: string[]
	contexts: Map<string, Container>

	constructor() {
		this.resolutions = new Map()
		this.whitelist = []
		this.contexts = new Map()
	}

	get cache(): Cache {
		return getCache()
	}

	getInjectionProxy(injectables: Array<?string>) {
		let context = this
		return {
			get(target: Class<*>, prop: string) {
				if (prop === '$$_Mosquito') {
					return true
				} else {
					return Reflect.get(target, prop)
				}
			},
			construct: (function(boundContainer: Container, target: Class<*>, params: any[]) {
				let container = boundContainer
				if (target.$$_Run_In_Instantiated_Context) {
					container = container.getContextualised(((target.$$_Run_In_Instantiated_Context: any): string))
				}
				let injections = []
				if (container == null) {
					injections = injectables.map(p => p == null ? null : boundContainer.make(p))
				} else {
					// $FlowFixMe Flow things container might be null here...it really isn't
					injections = injectables.map(p => p == null ? null : container.make(p))
				}

				const paramCopy = Array.from(params)
				const finalParams = injections // Interleave user provided params with resolutions, then append the remainder
					.map(provided => provided != null ? provided : paramCopy.shift())
					.filter(provided => provided != null)
					.concat(paramCopy)

				return new target(...finalParams)
			}).bind(null, context)
		}
	}

	get make(): (ident: string) => any {
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

	register(key: string, provider: Provider) {
		this.resolutions.set(key, provider)
	}

	clone() {
		const newContainer = new Container()
		newContainer.resolutions = new Map(this.resolutions)
		newContainer.whitelist = Array.from(this.whitelist)
		newContainer.contexts = new Map(this.contexts)

		return newContainer
	}

	getContextualised(id: string): ?Container {
		return this.contexts.get(id)
	}

	bind<T: Class<*>>(clazz: T, resolutions: Array<?string> = []): T {
		// $FlowFixMe Flow need not know about the proxy, only that it is (in terms of spec) the same type as T
		return new Proxy(clazz, this.getInjectionProxy(resolutions))
	}

	resolveInContext(clazz: Class<*>, bindings: BuilderFunction, run: Closure) {
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
