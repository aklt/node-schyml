
var faker = require('faker')
var h = require('./helpers')

module.exports = function (filename, cb) {
  h.withFile(filename, function (err, fileString) {
    if (err) return cb(err)
      console.log('TODO faker')
  })
}
