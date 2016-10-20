// @flow
import Container from './Container'
import * as utils from './utils'

function getParamList(clazz) {
	const dec = utils.getConstructorTree(clazz)
	return dec.value.params.map(param => param.name)
}

function getClassName(clazz) {
	const dec = utils.getClassDeclaration(clazz)[0]
	return dec.id.name
}

function constructorTrap() {
	return {
		construct(target, params) {
			const deps = getParamList(target).map(Container.make)
			return new target(...(params.concat(deps)))
		}
	}
}

class ProviderBuilder {
	when = name => {
		return {
			singleton: clazz => Container.register(name, {
				type: 'class',
				strategy: 'singleton',
				resolver: clazz,
				meta: {
					name: getClassName(clazz),
					params: getParamList(clazz)
				},
			}),
			instanceOf: clazz => Container.register(name, {
				type: 'class',
				strategy: 'instance',
				resolver: clazz,
				meta: {
					name: getClassName(clazz),
					params: getParamList(clazz)
				},
			}),
			object: obj => Container.register(name, {
				type: 'object',
				strategy: 'singleton',
				resolver: obj,
			}),
			copyOf: obj => Container.register(name, {
				type: 'object',
				strategy: 'copy',
				resolver: obj,
			}),
			resultOf: fn => Container.register(name, {
				type: 'function',
				strategy: 'call',
				resolver: fn,
			}),
		}
	}
}

class ServiceProvider {
	static provide = clazz => new Proxy(clazz, constructorTrap())
	register = (fn: (app: ProviderBuilder) => void) => fn(new ProviderBuilder())
}

export default ServiceProvider