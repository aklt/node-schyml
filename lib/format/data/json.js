var h = require('../../helpers')
var dataJs = require('./js')

module.exports = function (filename, opts, cb) {
  dataJs(filename, opts, function (err, js) {
    if (err) return cb(err);
    var fun = h.requireFromString(js, filename)
    cb(null, JSON.stringify(fun(), 0, 2))
  })
}
