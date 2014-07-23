
var readdir = require('fs').readdirSync;
var join = require('path').join;
var Integrations = require('..');
var assert = require('assert');

describe('Integrations', function(){
  it('should expose all integrations', function(){
    var lib = join(__dirname, '..', 'lib');
    readdir(lib).forEach(function(name){
      if (/\.js$/.test(name)) return;
      var path = join(lib, name);
      var Int = require(path);
      assert.equal(Int, Integrations[Int.prototype.name]);
    });
  });
});
