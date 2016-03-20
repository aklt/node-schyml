
var h = require('../helpers')

module.exports = function (fileName, cb) {
  h.withFile(fileName, function (err, js) {
    if (err) return cb(err);
    cb(null, JSON.stringify(js, 0, 2))
  })
}