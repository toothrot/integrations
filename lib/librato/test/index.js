
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var should = require('should');
var assert = require('assert');
var Librato = require('..');

describe('Librato', function () {
  var settings;
  var librato;

  beforeEach(function(){
    librato = new Librato;
    settings = {
      email: 'testing+librato@segment.io',
      token: 'eb753e965bfb546525fa78bb2c9472e50c16aa573f993e953c6773ff16f4c676'
    };
  });

  describe('.enabled()', function () {
    it('should be enabled for all messages', function () {
      librato.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      librato.enabled(new facade.Track({ channel : 'client' })).should.be.ok;
    });
  });


  describe('.validate()', function () {
    var identify = helpers.identify();

    it('should not validate settings without an email', function () {
      librato.validate(identify, {}).should.be.instanceOf(Error);
      librato.validate(identify, { token : 'x' }).should.be.instanceOf(Error);
    });

    it('should not validate messages without a token', function () {
      librato.validate(identify, { email : 'x' }).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      should.not.exist(librato.validate(identify, { email : 'x', token : 'y' }));
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();

    it('should do nothing', function (done) {
      librato.identify(identify, settings, done);
    });
  });


  describe('.track()', function () {
    var track = helpers.track();

    it('should track successfully', function (done) {
      librato.track(track, settings, done);
    });

    it('defaults to reporting a 1', function (){
      var result = librato.mapper.track(track);
      result.value.should.equal(1);
    });

    it('allows reporting zeroes', function(){
      var result = librato.mapper.track(helpers.track({
        properties: {
          value: 0
        }
      }));
      result.value.should.equal(0)
    });
  });


  describe('.alias()', function () {
    var alias = helpers.alias();

    it('should do nothing', function (done) {
      librato.alias(alias, settings, done);
    });
  });
});
