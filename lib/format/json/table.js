
var h = require('../../helpers')

module.exports = function (filename, opts, cb) {
  h.withFile(filename, function (err, json) {
    if (err) return cb(err);
    var result = {}
    if (opts.generator) {
      result.generator = opts.generator
    }
    var table = Object.keys(json)
    if (table.length !== 1) throw new Error("Only one table allowed");
    result.name = table[0]
    var o = json[table[0]]
    var props = Object.keys(o)
    if (props.length > 0) result.props = []
    props.forEach(function (name) {
      result.props.push({
        name: name,
        type: o[name].type,
        data: o[name].data
      })
    })
    cb(null, result)
  })
}
