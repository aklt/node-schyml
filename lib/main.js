
var fs = require('fs')
var path = require('path')
var stream = require('stream')
var h = require('./helpers')

function isStream(obj) {
  return (typeof obj.constructor === 'function' &&
    obj.out instanceof stream.Stream)
}

function outPutDataOrStream(data, inFile, outFile, cb) {
  // streams are output to inFile.png
  // data to stdout or file argument
  if (outFile === '-') {
    if (isStream(data)) {
      var outTo = path.dirname(inFile) + '/' +
          path.basename(inFile, path.extname(inFile)) + '.png'
      data.out.pipe(fs.createWriteStream(outTo))
      console.warn('wrote', outTo);
    } else {
      console.log(result)
    }
    return cb()
  } 
  if (isStream(data)) {
    data.out.pipe(fs.createWriteStream(outFile))
    return cb()
  }
  fs.writeFile(outFile, data, cb)
}

module.exports = function (converterArg, fileName, outFile, cb) {
  if (!cb) {
    cb = outFile
    outFile = '-'
  }
  if (!cb) {
    throw new Error("Usage: ...");
  }
  h.withConfig(function (err, config) {
    if (err) return cb(err)
    h.withLoadedConverter(converterArg, function (err, converter) {
      if (err) return cb(err)
      converter(fileName, config, (err, result) => {
        if (err) return cb(err)
        outPutDataOrStream(result, fileName, outFile, cb)
      })
    })
  })
}
