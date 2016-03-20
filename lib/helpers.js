
var fs = require('fs')

function lastCb(err) {
  if (err) {
    if (typeof err !== 'Error') err = new Error(err)
    throw err
  }
}

function withFile(filename, cb) {
  yamlResolve(filename, cb)
}

var jsYaml = require('js-yaml')
var jsonRefs = require('json-refs')

function yamlToJsNoRefs(string) {
  return jsYaml.safeLoad(string)
}

function yamlToJs(string) {
  return jsonRefs.resolveRefs(yamlToJsNoRefs(string))
}

function yamlResolve (location, cb) {
  var options = {
    loaderOptions: {
      processContent: function (res, callback) {
        callback(undefined, jsYaml.safeLoad(res.text));
      }
    }
  };

  jsonRefs.resolveRefsAt(location, options)
  .then(function (results) {
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
  .catch(function (er) {
    console.log(er)
  })
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

module.exports = {
  cb: lastCb,
  withFile: withFile,
  yamlToJs: yamlToJs,
  yamlToJsNoRefs: yamlToJsNoRefs,
  yamlResolve: yamlResolve,
  withLoadedConverter: withLoadedConverter
}
