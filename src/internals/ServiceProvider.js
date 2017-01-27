// @flow
import Container from './Container'
import * as utils from './utils'

function getClassName(clazz) {
	const dec = utils.getClassDeclaration(clazz)[0]
	return dec.id.name
}

class ProviderBuilder {
	container: Container

	constructor(container: typeof Container = Container) {
		this.container = container
	}

	when = name => {
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

export class ServiceProvider {
	register = (fn: (app: ProviderBuilder) => void) => fn(new ProviderBuilder())
	registerWith = (container: typeof Container, fn: (app: ProviderBuilder) => void) => fn(new ProviderBuilder(container))
}

// export default ServiceProvider
