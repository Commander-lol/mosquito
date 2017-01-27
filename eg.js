const Module = require('module')
const stripBOM = require('strip-bom')
const fs = require('fs-jetpack')

Module._extensions['.js'] = function(module, filename) {
	const file = fs.read(filename, 'utf-8')
	return module._compile(stripBOM(file), filename)
}
