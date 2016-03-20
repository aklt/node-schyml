
var jsYaml = require('js-yaml')

module.exports = function (fileName, cb) {
  fs.readFile(fileName, function (err, data) {
    if (err) return cb(err);
    cb(null, JSON.stringify(jsYaml.safeLoad(data.toString(), 0, 2)))
  })
}
