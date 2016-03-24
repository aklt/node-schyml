
var puml = require('node-plantuml')
var uml = require('../uml')

module.exports = function (fileName, opts, cb) {
  uml(fileName, opts, function (err, iuml) {
    if (err) return cb(err);
    cb(null, puml.generate("@startuml\n" + iuml + "\n@enduml\n",
      {format: 'png'}))
  })
}
