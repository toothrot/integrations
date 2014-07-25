
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var should = require('should');
var assert = require('assert');
var Outbound = require('..');

describe('Outbound', function () {
  var outbound;
  var settings;

  beforeEach(function(){
    outbound = new Outbound;
    settings = { apiKey: 'f4f15f2f004fa0bd2140b4db93cbb538' };
  });

  describe('.enabled()', function () {
    it('should only be enabled for all messages', function () {
      outbound.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      outbound.enabled(new facade.Track({ channel : 'client' })).should.be.ok;
      outbound.enabled(new facade.Track({})).should.be.ok;
    });
  });


  describe('.validate()', function () {
    it('should require an api key', function () {
      outbound.validate({}, { apiKey : '' }).should.be.an.instanceOf(Error);
      outbound.validate({}, {}).should.be.an.instanceOf(Error);
      should.not.exist(outbound.validate({}, { apiKey : 'xxx' }));
    });
  });


  describe('.track()', function () {
    it('should track successfully', function (done) {
      var track = helpers.track();
      outbound.track(track, settings, done);
    });
  });

  describe('.identify()', function () {

    it('should track successfully', function (done) {
      var identify = helpers.identify();
      outbound.identify(identify, settings, done);
    });
  });


  describe('.alias()', function () {
    it('should do nothing', function (done) {
      var alias = helpers.alias();
      outbound.alias(alias, settings, done);
    });
  });
});
