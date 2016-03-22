var markdownIt = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true
}).use(require('markdown-it-deflist'))

var fs = require('fs')

module.exports = function (fileName, opts, cb) {
  fs.readFile(fileName, function (err, data) {
    if (err) return cb(err)
    var result = []
    data.toString().split(/[\n\r]+/).forEach((line) => {
      if (!/^#/.test(line)) return
      result.push(line.slice(1))
    })
    cb(null, markdownIt.render(result.join('\n') + '\n'))
  })
}
