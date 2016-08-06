
var fs = require('fs')
var path = require('path')
var util = require('util')
var jsYaml = require('js-yaml')
var jsonRefs = require('json-refs')
var handlebars = require('handlebars')

handlebars.registerHelper('lc', function (str) {
  var res = str[0].toLowerCase() + str.slice(1)
  return res
})

handlebars.registerHelper('uc', function (str) {
  var res = str[0].toUpperCase() + str.slice(1)
  return res
})

handlebars.registerHelper('readFile', function (filename) {
  if (!fs.existsSync(filename)) {
    console.warn('No such path: ' + filename)
    return null
  }
  return fs.readFileSync(filename).toString()
})

handlebars.registerHelper('value', function (value, defaultValue) {
  return new handlebars.SafeString(value || defaultValue)
})

handlebars.registerHelper('pp', function (str) {
  return JSON.parse(str, 0, 2).toString()
})

function readExistingFile (fileName, defaultFile, cb, count) {
  if (typeof count !== 'number') {
    count = 3
  }
  if (count === 0) {
    return cb(new Error('readExistingFile'))
  }
  fs.exists(fileName, function (exists) {
    if (!exists) {
      var rs = fs.createReadStream(defaultFile)
      var ws = fs.createWriteStream(fileName)
      ws.on('error', cb)
      rs.on('end', function () {
        console.warn('wrote file', fileName)
        readExistingFile(fileName, defaultFile, cb, count - 1)
      })
      .on('error', cb)
      rs.pipe(ws)
    } else {
      fs.readFile(fileName, cb)
    }
  })
}

function readHandlebars (handlebarsString, json, cb) {
  var tpl
  try {
    tpl = handlebars.compile(handlebarsString.toString())
  } catch (e) {
    return cb(e)
  }
  cb(null, tpl(json))
}

function readYaml (string, json, cb) {
  var result
  try {
    result = jsYaml.safeLoad(string)
  } catch (e) {
    return cb(e)
  }
  cb(null, result)
}

var resolveYamlOptions = {
  filter: function (obj) {
    return !/^#\//.test(obj.uri)
  },
  relativeBase: '.',
  loaderOptions: {
    processContent: function (res, cb) {
      readYaml(res.text, {}, cb)
    }
  }
}

function readYamlResolved (string, json, cb) {
  readYaml(string, json, (err, data) => {
    if (err) return cb(err)
    var options = util._extend({}, resolveYamlOptions)
    if (json.relativeBase) {
      options.relativeBase = json.relativeBase
    }
    jsonRefs.resolveRefs(data, options).then((results) => {
      var errors = []
      Object.keys(results.refs).forEach(function (refPtr) {
        var refDetails = results.refs[refPtr]
        if (refDetails.type === 'invalid' || refDetails.error) {
          errors.push('  ' + refPtr + ': ' + refDetails.error)
        }
      })
      if (errors.length > 0) {
        return cb(
            new Error('Document has invalid references:\n\n' + errors.join('\n')))
      }
      cb(null, results.resolved)
    }).catch((e) => {
      cb(e)
    })
  })
}

function readYamlString (obj, json, cb) {
  var t = typeof obj
  if (obj === null || t === 'undefined') return cb()
  var yaml
  try {
    yaml = jsYaml.safeDump(obj)
  } catch (e) {
    return cb(e)
  }
  cb(null, yaml)
}

function handlebarsReadFile (filename, json, cb) {
  fs.readFile(filename, (err, data) => {
    if (err) return cb(err)
    readHandlebars(data.toString(), json, cb)
  })
}

function readModelContents (data, json, cb) {
  // Read the model including the markdown formatted comments splitting into
  // header, text and footer
  var result = {}
  var s1 = data.toString()
  var l1 = s1.split(/(?:\r\n|\n)/)
  var loc = 'header'
  for (var i = 0; i < l1.length; i += 1) {
    var line = l1[i]
    if (/^#/.test(line)) {
      if (loc === 'text') loc = 'footer'
    } else {
      if (loc === 'header') loc = 'text'
    }
    if (!result[loc]) result[loc] = []
    result[loc].push(line)
  }
  var res = { }
  if (result.header) res.header = result.header.join('\n')
  if (result.text) res.text = result.text.join('\n')
  if (result.footer) res.footer = result.footer.join('\n')
  cb(null, res)
}

function loadResolvedModelFile (filePath, json, cb) {
  handlebarsReadFile(filePath, json, (err, fileString) => {
    if (err) return cb(err)
    readModelContents(fileString, json, (err, model) => {
      if (err) return cb(err)
      readYamlResolved(model.text, json, (err, yaml) => {
        if (err) return cb(err)
        var res = {}
        var keys = Object.keys(yaml)
        if (keys.length !== 1) {
          return cb(new Error('Only one key in a model at file: ' + filePath))
        }
        var obj = res[keys[0]] = {}
        if (model.header) obj.header = model.header
        obj.fields = yaml[keys[0]]
        if (model.footer) obj.footer = model.footer
        cb(null, res)
      })
    })
  })
}

function listModelFilesInDir (dirname, cb) {
  fs.readdir(dirname, (err, files) => {
    if (err) return cb(err)
    files = files.filter((d) => {
      return /^[A-Z].*\.yml$/.test(d)
    })
    cb(null, files)
  })
}

function readModelDir (dirname, justThese, json, cb) {
  listModelFilesInDir(dirname, (err, files) => {
    if (err) return cb(err)
    if (justThese.length > 0) {
      var orderedFiles = []
      justThese.forEach((f1) => {
        var i = files.indexOf(f1 + '.yml')
        if (i > -1) orderedFiles.push(files[i])
      })
      files = orderedFiles
    }
    if (files.length === 0) {
      return cb(new Error('No models defined in ' + dirname))
    }
    var count = files.length
    var result = {}
    for (var i = 0; i < files.length; i += 1) {
      var fileName = files[i]
      var filePath = path.join(dirname, fileName)
      json.relativeBase = dirname
      loadResolvedModelFile(filePath, json, (err, model) => {
        if (err) return cb(err)
        // TODO Check syntax
        var keys = Object.keys(model)
        if (result[keys[0]]) {
          return cb(new Error('Key ' + keys[0] + ' already defined, file: ' + filePath))
        }
        result[keys[0]] = model[keys[0]]
        count -= 1
        if (count === 0) {
          return cb(null, result)
        }
      })
    }
  })
}

function readConfig (fileName, defaultFile, json, cb) {
  readExistingFile(fileName, defaultFile, (err, data) => {
    if (err) return cb(err)
    readYamlResolved(data, json, cb)
  })
}

function findSchymlRootDir (fromDir, cb) {
  var fullPath = path.resolve(fromDir);
  (function loop (p) {
    if (p === '/') {
      return cb(new Error('No .schyml file found from dir ' + fullPath))
    }
    fs.exists(path.join(p, '.schyml'), (exists) => {
      if (exists) return cb(null, p)
      loop(path.dirname(p))
    })
  })(fullPath)
}

function readModel (fileName, defaultFile, justThese, cb) {
  var json = process.env
  findSchymlRootDir(process.cwd(), (err, dir) => {
    if (err) return cb(err)
    var configFile = path.join(dir, fileName)
    json.relativeBase = dir
    readConfig(configFile, defaultFile, json, (err, config) => {
      if (err) return cb(err)
      var schyml = config.schyml
      var msg = 'Need schyml property in config file ' + fileName
      if (!schyml) return cb(new Error(msg))
      msg = 'Need modeldir in ' + fileName
      if (!schyml.modelDir) return cb(new Error(msg))
      var modelDir = path.join(dir, schyml.modelDir)
      if (!fs.existsSync(modelDir)) return cb(new Error('Badness: ' + modelDir))
      // console.warn('chdir ' + modelDir)
      // process.chdir(modelDir)
      readModelDir(modelDir, justThese, config, (err, model) => {
        if (err) return cb(err)
        schyml.model = model
        cb(null, config, dir)
      })
    })
  })
}

function runFormatterOnModel (formatter, model, cb) {
  requireJsFile(formatter, (err, convert) => {
    if (err) return cb(err)

    function iterModel (cbTable, cbField, cbHeader, cbFooter) {
      if (!cbFooter) cbFooter = () => {}
      if (!cbHeader) cbHeader = () => {}
      if (!cbField) cbField = () => {}
      var m = model.schyml.model
      var models = Object.keys(m)
      for (var i = 0; i < models.length; i += 1) {
        var modelName = models[i]
        var modelObject = m[modelName]
        var type = typeof modelObject
        if (type === 'string' || type === 'number' || Array.isArray(modelObject)) {
          var val = cbField(modelName, modelObject)
          if (val) m[modelName] = val
        } else {
          cbTable(modelName)
          if (modelObject.header) cbHeader(modelObject.header)
          if (modelObject.fields) {
            var fields = Object.keys(modelObject.fields)
            for (var j = 0; j < fields.length; j += 1) {
              cbField(fields[j], modelObject.fields[fields[j]])
            }
          }
          if (modelObject.footer) cbFooter(modelObject.footer)
        }
      }
    }

    var formattedModel
    try {
      formattedModel = convert(model.schyml, iterModel)
    } catch (e) {
      return cb(e)
    }
    cb(null, formattedModel)
  })
}

var configFileName = '.schyml'
var configDefaultFile = path.join(__dirname, 'dot.schyml')
var readmeFile = path.join(__dirname, 'README.md')
var options = {}

function lastCb (err, msg) {
  // console.warn('lastCb', err, options, msg)
  if (err) {
    if (!(err instanceof Error)) err = new Error(err)
    return console.warn('schyml', err.stack)
  }
  if (typeof msg === 'string') {
    return console.log(msg)
  }
  if (options.format === 'json') {
    console.log(JSON.stringify(msg, 0, 2))
  } else { // if (options.format === 'json') {
    readYamlString(msg, {}, (err, str) => {
      if (err) return lastCb(err)
      console.log(str)
    })
  }
}


function main (/* command, fileName, outFile, cb */) {
  var args = [].slice.call(arguments)
  var cb = args.pop()
  var showJson = args.some((arg) => {
    return /^--json$/.test(arg)
  })
  if (showJson) options.format = 'json'
  else options.format = 'yaml'
  var cmd = args.shift()
  if (typeof cb !== 'function') throw new Error('cb should be a func!')

  if (!cmd) {
    return cb(null, 'schyml version: ' + require('./package').version + '\n' +
                    'Usage: schyml <conf|help|yaml|model|list> args...')
  }
  if (cmd === 'help') {
    return fs.readFile(readmeFile, (err, data) => {
      if (err) return cb(err)
      cb(null, data.toString())
    })
  }

  if (cmd === 'conf') {
    return readConfig(configFileName, configDefaultFile, process.env, cb)
  } else {
    if (cmd === 'list') {
      return readConfig(configFileName, configDefaultFile, process.env, (err, conf) => {
        if (err) return cb(err)
        listModelFilesInDir(conf.schyml.modelDir, (err, files) => {
          if (err) return cb(err)
          files = files.map((f1) => { return f1.replace(/\.yml$/, '') })
          cb(null, files)
        })
      })
    }
  }

  var jsFile
  var hbsFile

  for (var i = 0; i < 2; i += 1) {
    if (/\.js$/i.test(args[i])) {
      jsFile = args[i]
    } else if (/\.(?:hbs|handlebars|mustache)$/i.test(args[i])) {
      hbsFile = args[i]
    }
  }

  if (jsFile) args.splice(args.indexOf(jsFile), 1)
  if (hbsFile) args.splice(args.indexOf(hbsFile), 1)

  var modelNames = args.filter((f) => { return /^[A-Z]/.test(f) })
                       .map((f) => { return path.basename(f).replace(/\.\w\w\w?$/, '') })

  var evalArgs = args.filter((f) => { return !/^[A-Z]/.test(f) })

  readModel(configFileName, configDefaultFile, modelNames, (err, model, rootDir) => {
    if (err) return cb(err)
    if (cmd === 'yaml') {
      var res = {}
      var s = model.schyml
      Object.keys(s).forEach((prop) => {
        if (prop === 'model') return
        if (typeof s[prop] !== 'object') res[prop] = s[prop]
      })
      var m = s.model
      res.model = {}
      Object.keys(m).forEach((name) => {
        res.model[name] = m[name].fields
      })
      return cb(null, res)
    }

    if (cmd === 'model') {
      if (!hbsFile && !jsFile) return cb(null, model.schyml)
      if (hbsFile && !jsFile) {
        return handlebarsReadFile(hbsFile, model.schyml, (err, str) => {
          if (err) return cb(err)
          cb(null, str)
        })
      }
      if (jsFile) {
        var formatter = path.resolve(rootDir, jsFile)
        runFormatterOnModel(formatter, model, (err, formattedModel) => {
          if (err) return cb(err)
          if (!hbsFile) return cb(null, formattedModel)
          handlebarsReadFile(hbsFile, formattedModel, (err, str) => {
            if (err) return cb(err)
            if (evalArgs.length > 0) {
              return requireFromString(str, hbsFile, (err, func) => {
                if (err) return cb(err)
                if (typeof func === 'function') {
                  evalArgs = func.apply(null, evalArgs)
                }
              })
            }
            cb(null, str)
          })
        })
      }
    }
  })
}

function requireJsFile (fileName, cb) {
  var m
  try {
    m = require(fileName)
  } catch (e) {
    return cb(e)
  }
  cb(null, m)
}

function requireFromString (src, filename, cb) {
  var Module = module.constructor
  var m = new Module()
  try {
    m._compile(src, filename)
  } catch (e) {
    return cb(e)
  }
  cb(null, m.exports)
}

module.exports = {
  main: main,
  cb: lastCb
}
