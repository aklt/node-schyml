
var types = {
  table: './knex',
  faker: './faker',
  doc:   './doc',
  json:  './json',
}

var h = require('./helpers')

module.exports = function (converterName, fileName, cb) {
  h.withLoadedConverter(converterName, function (err, converter) {
    if (err) return cb(err);
    converter(fileName, (err, result) => {
      if (err) return cb(err);
      console.log(result)
      cb()
    })
  })
}
