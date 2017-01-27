const Module = require('module')
const stripBOM = require('strip-bom')
const fs = require('fs-jetpack')
const { BabylonParser } = require('../parsers/Babylon')

function wrapClassExpression(clazzExp, replacements) {
	return `(function() {
	return new Proxy(${clazzExp}, Container.getInjectionProxy([${replacements.map(JSON.stringify).join(',')}]));
}())`
}

function wrapClassDeclaration(name, clazzDec, replacements) {
	return `const ${name} = ${wrapClassExpression(clazzDec, replacements)}; console.log(${name});`
}

const original = Module._extensions['.js']

Module._extensions['.js'] = function(module, filename) {
	if (filename.includes('node_modules') && Container.whitelist.every(entry => !filename.includes(entry))) {
		original(module, filename)
	} else {
		const file = fs.read(filename, 'utf-8')

		const parser = new BabylonParser(file, { filename })

		const content = parser.transform({
			ClassExpression: wrapClassExpression,
			ClassDeclaration: wrapClassDeclaration,
		})

		return module._compile(stripBOM(content), filename)
	}
}
