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

class Container {
	resolutions: Map<string, Provider>

	constructor() {
		this.resolutions = new Map()
	}

	make = (ident: string) => {
		const resolution = this.resolutions.get(ident)
		if (resolution == null) throw new TypeError(`Cannot make undefined object ${ident}`)
		if (resolution.type === 'class') {
			return resolveClass(resolution, this)
		} else if (resolution.type === 'function') {
			return resolveFunction(resolution, this)
		} else {
			return resolveObject(resolution, this)
		}
	}

	register(key, provider) {
		this.resolutions.set(key, provider)
	}
}

if (global[ContainerSymbol] == null) {
	global[ContainerSymbol] = new Container
}

export default global[ContainerSymbol]