
var fs = require('fs')
var path = require('path')
var puml = require('node-plantuml')
var uml = require('../uml')

module.exports = function (fileName, opts, cb) {
  uml(fileName, opts, function (err, iuml) {
    if (err) return cb(err);

    var umlString = "@startuml\n" + iuml + "\n@enduml\n"
    var gen = puml.generate(umlString, {format: 'png'})
    var outFile = path.dirname(fileName) + '/' +
        path.basename(fileName, path.extname(fileName)) + '.png'
    var fileStream = fs.createWriteStream(outFile)
    gen.out.pipe(fileStream)
  })
}
