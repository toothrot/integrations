
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var assert = require('assert');
var should = require('should');
var Lytics = require('..');

describe('Lytics', function () {
  var settings;
  var lytics;

  beforeEach(function(){
    lytics = new Lytics;
    settings = {
      apiKey: 'LPv7adzJu8IhRMTbgWmaagxx',
      cid: 1289
    };
  });

  describe('.enabled()', function () {

    it('should only be enabled for server side messages', function () {
      lytics.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      lytics.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
      lytics.enabled(new facade.Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {

    it('should require a cid', function () {
      lytics.validate({}, { apiKey : 'x', cid : '' }).should.be.an.instanceOf(Error);
      lytics.validate({}, { apiKey : 'x' }).should.be.an.instanceOf(Error);
      should.not.exist(lytics.validate({}, { apiKey : 'x', cid : 'x' }));
    });

    it('should require an apiKey', function () {
      lytics.validate({}, { cid : 'x', apiKey : '' }).should.be.an.instanceOf(Error);
      lytics.validate({}, { cid : 'x' }).should.be.an.instanceOf(Error);
      should.not.exist(lytics.validate({}, { apiKey : 'x', cid : 'x' }));
    });
  });


  describe('.track()', function () {

    it('should track successfully', function (done) {
      var track = helpers.track();
      lytics.track(track, settings, done);
    });
  });

  describe('.identify()', function () {

    it('should identify successfully', function (done) {
      var identify = helpers.identify();
      lytics.identify(identify, settings, done);
    });
  });


  describe('.alias()', function () {

    it('should alias successfully', function (done) {
      var alias = helpers.alias();
      lytics.alias(alias, settings, done);
    });
  });
});
