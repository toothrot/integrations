
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var isodate = require('isodate-traverse');
var assert = require('assert');
var should = require('should');
var KeenIO = require('..');

describe('Keen IO', function () {
  var settings;
  var keen;

  before(function(){
    // fake .use() for now.
    KeenIO.prototype.use = function(plugin){
      plugin(this);
      return this;
    };
  })

  beforeEach(function(){
    keen = new KeenIO;
    keen.use(maptest());
    settings = {
      projectId: '5181bcd23843312d87000000',
      writeKey: '6d5c9e2365324fa4a631e88cd4ce7df3ca4bf41e5a9a29e48c2dfb57408bb978f5d2e6d77424fa14c9d167c72d8e1d618c7eea178ecf5934dc8d456e0114ec81112f81e8df9507a31b7bfee9cbd00944f59d54f199f046263578ded79b62c33a435f17907bffae8fd8e109086eb53f1b'
    };
  });

  it('should have the correct settings', function(){
    test(keen)
      .name('Keen IO')
      .retries(2);
  });

  describe('.enabled()', function () {
    it('should be enabled on server channel', function(){
      test(keen).enabled({ channel: 'server' });
    });

    it('should be disabled on other channels', function(){
      test(keen).disabled({ channel: 'client' });
    });
  });

  describe('.validate()', function () {
    it('should be invalid if .projectId is missing', function(){
      delete settings.projectId;
      test(keen).invalid({}, settings);
    });

    it('should be invalid if .writeKey is missing', function(){
      delete settings.writeKey;
      test(keen).invalid({}, settings);
    });

    it('should be valid when .writeKey and .projectId are given', function () {
      test(keen).valid({}, settings);
    });
  });

  describe.only('mapper', function(){
    describe('track', function(){
      it('should basic data correctly', function(){
        keen.fixture('basic', settings);
      });

      it('should fallback to session id', function(){
        keen.fixture('session-id', settings);
      });
    });
  });


  describe('.track()', function () {
    it('should track correctly', function (done) {
      keen.track(track, settings, done);
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      keen.identify(identify, settings, done);
    });
  });


  describe('.alias()', function () {
    var alias = helpers.alias();
    it('should do nothing', function (done) {
      keen.alias(alias, settings, done);
    });
  });
});

/**
 * fake plugin for integrations (we should add this to tester)
 */

function maptest(){
  return function(integration){
    integration.fixture = function(name, settings){
      var json = require(__dirname + '/fixtures/' + name + '.json')
      var input = json.from;
      var output = json.to;
      assert(input, 'must call map(fixture) before `.to()`');
      var t = input.type[0].toUpperCase() + input.type.slice(1);
      var Type = facade[t];
      assert(Type, 'unknown type "' + t + '"');
      var msg = new Type(input);
      var mapped = integration.mapper[input.type](msg, settings);
      mapped = JSON.parse(JSON.stringify(mapped)); // hack for now. (use isodate())
      mapped.should.eql(output);
      return this;
    };
  };
}
