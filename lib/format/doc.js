var markdownIt = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true
}).use(require('markdown-it-deflist'))

var h = require('./helpers')

module.exports = function (fileName, cb) {
  h.withFile(fileName, function (err, fileString) {
    if (err) return cb(err)
      var result = []
    fileString.split(/[\n\r]+/).forEach((line) => {
      if (!/^#/.test(line)) return
      result.push(line.slice(1))
    })
    console.log(markdownIt.render(result.join('\n') + '\n'))
  })
}
