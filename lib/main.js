
var h = require('./helpers')

module.exports = function (converterArg, fileName, cb) {
  h.withConfig(function (err, config) {
    if (err) return cb(err);
    h.withLoadedConverter(converterArg, function (err, converter) {
      if (err) return cb(err);
      converter(fileName, config, (err, result) => {
        if (err) return cb(err);
        console.log(result)
        cb()
      })
    })
  })
}
