const path = require('path')
const fs = require('fs')


const dir = [__dirname, 'multimedia', '62f1495431ef6d9fedbee6ad'].join(path.sep)

fs.mkdirSync(dir)