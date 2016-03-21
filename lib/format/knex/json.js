
var _ = require('lodash')
var h = require('../../helpers')

module.exports = function (fileName, opts, cb) {
  h.withFile(fileName, function (err, obj) {
    if (err) return cb(err);
    console.warn('TODO lodash out all the knex props');
    cb(null, obj)
  })
}
