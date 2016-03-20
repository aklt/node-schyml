
var types = {
  table: './knex',
  faker: './faker'
}

module.exports = function (typeName, filename) {
  var converterScript = types[typeName]
  if (!converterScript) {
    throw new Error("Cannot find type: " + typeName, " valid types are: " +
                    Object.keys(types).join("\n"));
  }
  var converter = require(converterScript)
  converter(filename, (err, newFile) => {
    if (err) return cb(err);
    console.log(newFile)
  })
}
