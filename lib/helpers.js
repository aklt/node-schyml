
var fs = require('fs')

function lastCb(err) {
  if (err) {
    if (typeof err !== 'Error') err = new Error(err)
    throw err
  }
}

function withFile(filename, cb) {
  fs.readFile(filename, function (err, data) {
    if (err) return cb(err);
    cb(null, data.toString())
  })
}

module.exports = {
  cb: lastCb,
  withFile: withFile
}
