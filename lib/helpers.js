
var fs = require('fs')

function lastCb(err) {
  if (err) {
    if (typeof err !== 'Error') err = new Error(err)
    throw err
  }
}

function withFile(filename, cb) {
  yamlResolveLocation(filename, cb)
}

var configFile = '.schyf'
function withConfig(cb) {
  fs.exists(configFile, function (exists) {
    if (!exists) {
      return cb(null, {generator: 'faker'})
    }
    withFile(configFile, cb)
  })
}

var jsYaml = require('js-yaml')
var jsonRefs = require('json-refs')

function yamlToJsNoRefs(string) {
  return jsYaml.safeLoad(string)
}

function yamlToJs(string) {
  return jsonRefs.resolveRefs(yamlToJsNoRefs(string))
}

function yamlResolveLocation (location, cb) {
  var options = {
    loaderOptions: {
      processContent: function (res, callback) {
        callback(undefined, jsYaml.safeLoad(res.text));
      }
    }
  };

  jsonRefs.resolveRefsAt(location, options).then(function (results) {
    var errors = []

    Object.keys(results.refs).forEach(function (refPtr) {
      var refDetails = results.refs[refPtr]

      if (refDetails.type === 'invalid' || refDetails.error) {
        errors.push('  ' + refPtr + ': ' + refDetails.error)
      }
    });

    if (errors.length > 0) {
      return cb(
        new Error('Document has invalid references:\n\n' + errors.join('\n')))
    } 
    cb(null, results.resolved)
  })
  .catch(cb)
}

function withLoadedConverter (name, cb) {
  var m
  try {
    m = require('./format/' + name)
  } catch (e) {
    return cb(e)
  }
  cb(null, m)
}

function readOptString(str) {
  // Read the first argument
  var opts = []

  var iOpts = str.indexOf('@')
  var iFile = str.indexOf(':')
  var iName

  iOpts = iOpts < 0 ? str.length : iOpts
  iFile = iFile < 0 ? str.length : iFile
  iName = Math.min(iOpts, iFile)

  var converterName = str.slice(0, iName)
  var converterOpts = str.slice(iOpts + 1)
  var converterFile = str.slice(iFile + 1, iOpts)

  var parts = converterOpts.split(/\s*,\s*/)
  if (parts.length === 1 && parts[0] === '') {
    opts = ''
  } else if (converterOpts.indexOf(':') > -1) {
    opts = {}
    parts.forEach((p1) => {
      var keyValue = p1.split(/:/)
      opts[keyValue[0]] = keyValue[1]
    })
  } else {
    opts = parts
  }
  var result = {
    file: converterName,
  }
  if (iOpts > iFile) {
    result.optsFile = converterFile
  }
  if (opts) {
    result.opts = opts
  }
  return result
}

// console.log(readOptString('json/ref'))
// console.log(readOptString('json/ref@id/foo,id/bar'))
// console.log(readOptString('json/ref:config/opts.yml'))

var mustache = require('mustache')

function renderFiles (mustacheFile, dataFile, cb) {
  fs.readFile(mustacheFile, function (err, data) {
    if (err) return cb(err);
    withFile(dataFile, function (err, json) {
      if (err) return cb(err);
      cb(null, mustache.render(data.toString(), json))
    })
  })
}

function renderObject(mustacheFile, json, cb) {
  fs.readFile(mustacheFile, function (err, data) {
    if (err) return cb(err);
    cb(null, mustache.render(data.toString(), json))
  })
}

function requireFromString(src, filename) {
  var Module = module.constructor;
  var m = new Module();
  m._compile(src, filename);
  return m.exports;
}

function evalRenderFiles(mustacheFile, dataFile, cb) {
  renderFiles(mustacheFile, dataFile, function (err, fileString) {
    if (err) return cb(err);
    cb(null, requireFromString(fileString, mustacheFile))
  })
}

module.exports = {
  cb: lastCb,
  withFile: withFile,
  withConfig: withConfig,
  yamlToJs: yamlToJs,
  yamlToJsNoRefs: yamlToJsNoRefs,
  yamlResolveLocation: yamlResolveLocation,
  withLoadedConverter: withLoadedConverter,
  readOptString: readOptString,
  renderFiles: renderFiles,
  renderObject: renderObject,
  requireFromString: requireFromString,
  evalRenderFiles: evalRenderFiles,
  requireFromString: requireFromString
}
