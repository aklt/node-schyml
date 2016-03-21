
var h = require('../../helpers')
var tableJson = require('../json/table')
var template = __dirname + '/' + 'data.mustache'

module.exports = function (fileName, opts, cb) {
  tableJson(fileName, opts, function (err, json) {
    if (err) return cb(err);
    h.renderObject(template, json, function (err, result) {
      if (err) return cb(err);
      cb(null, result)
    })
  })
}
