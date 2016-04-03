# Schyml - Generate data from YAML

Usage:
    
    schyml              - show help
    schyml conf         - show config in .schyml file
    schyml help         - show this help
    schyml yaml         - show yaml of model
    schyml model [args] - show complete model applying args, see below
    schyml list         - list model names

args can be

  * <file.hbs> to use the model on handlebars file <file.hbs>
  * <file.js> to format the model

If both args <file.hbs> and <file.js> are supplied <file.hbs> is applied to
the format output by <file.js>.

Next args select which parts of the model to work on.  These are all uppercase
strings.

Finally the eval argument may be passed to indicate that the output of
<file.hbs> and/or <file.js> is a js module schyml should output the result of
evaluating it with the remaining arguments.

## Formatting

The <file.js> argument should be a Javascript file that returns a new
representation of the model. It is passed the model and an iterator function
to iterate the model:

	module.exports = function (model, iterModel) {
	  var result = {}
	  var table
	  function onTable (t) {
		table = t
		if (!result[table]) result[table] = {}
	  }
	  function onField (field, value) {
		if (!table) result[field] = value
		else result[table][field] = value
	  }
	  function onHeader (text) {
		result[table].header = text
	  }
	  function onFooter (text) {
		result[table].footer = text
	  }
	  iterModel(onTable, onField, onHeader, onFooter)
	  return result
	}
