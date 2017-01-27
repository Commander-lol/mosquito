const {StandardParser} = require('./lib/parsers/Standard')
const fs = require('fs-jetpack');
const src = fs.read('./src/examples/simple.js');
const ps = new StandardParser(src)
