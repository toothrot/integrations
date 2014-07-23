
/**
 * Module dependencies.
 */

var readdir = require('fs').readdirSync;
var join = require('path').join;

/**
 * Export our integrations.
 */

readdir(__dirname).forEach(function(name){
  if (/\.js$/.test(name)) return;
  var Integration = require(join(__dirname, name));
  exports[Integration.prototype.name] = Integration;
});
