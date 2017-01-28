// @flow
import Container from './Container'
import * as utils from './utils'
import type { Provider } from './Container.types'

function getClassName(clazz) {
	const dec = utils.getClassDeclaration(clazz)[0]
	return dec.id.name
}

class ProviderBuilder {
	container: Container

	constructor(container: typeof Container = Container) {
		this.container = container
	}

	when = (name: string): ServiceProviderBuilder => {
		const provider = this
		return {
			singleton: clazz => provider.container.register(name, {
				type: 'class',
				strategy: 'singleton',
				resolver: clazz,
				meta: {
					name: getClassName(clazz),
				},
			}),
			instanceOf: clazz => provider.container.register(name, {
				type: 'class',
				strategy: 'instance',
				resolver: clazz,
				meta: {
					name: getClassName(clazz),
				},
			}),
			object: obj => provider.container.register(name, {
				type: 'object',
				strategy: 'singleton',
				resolver: obj,
			}),
			copyOf: obj => provider.container.register(name, {
				type: 'object',
				strategy: 'copy',
				resolver: obj,
			}),
			resultOf: fn => provider.container.register(name, {
				type: 'function',
				strategy: 'call',
				resolver: fn,
			}),
			library: ident => provider.container.register(name, {
				type: 'require',
				strategy: 'require',
				resolver: ident,
			})
		}
	}
}

type Builder<T> = (param: T) => Provider

export type ServiceProviderBuilder = {
	singleton: Builder<Class<*>>,
	instanceOf: Builder<Class<*>>,
	object: Builder<any>,
	copyOf: Builder<Object>,
	resultOf: Builder<Function>,
	library: Builder<string>,
}

export type BuilderFunction = (app: ProviderBuilder) => void

export class ServiceProvider {
	register = (fn: BuilderFunction) => fn(new ProviderBuilder())
	registerWith = (container: typeof Container, fn: BuilderFunction) => fn(new ProviderBuilder(container))
}

// export default ServiceProvider
