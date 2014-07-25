
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var should = require('should');
var assert = require('assert');
var Preact = require('..');

describe('Preact', function () {
  var settings;
  var preact;

  beforeEach(function(){
    preact = new Preact;
    settings = {
      projectCode: 'xzdp2lscug',
      apiSecret: 'fswi6mj6po'
    };
  });

  describe('.enabled()', function () {
    it('should only be enabled for server side messages', function () {
      preact.enabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'server'
      })).should.be.ok;

      preact.enabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'client'
      })).should.not.be.ok;

      preact.enabled(new facade.Track({
        userId: 'calvin@segment.io'
      })).should.not.be.ok;
    });

    it('should only be enabled for messages with an email', function () {
      preact.enabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'server'
      })).should.be.ok;

      preact.enabled(new facade.Track({
        channel: 'server'
      }));
    });
  });


  describe('.validate()', function () {
    it('should require a projectCode', function () {
      preact.validate({}, { projectCode : '' }).should.be.an.instanceOf(Error);
      preact.validate({}, { projectCode : '', apiSecret : 'xxx' }).should.be.an.instanceOf(Error);
    });

    it('should require an apiSecret', function () {
      preact.validate({}, { apiSecret : '' }).should.be.an.instanceOf(Error);
      preact.validate({}, { apiSecret : '', projectCode : 'xxx' }).should.be.an.instanceOf(Error);
    });

    it('should validate with the required settings', function () {
      should.not.exist(preact.validate({}, { projectCode : 'xxx', apiSecret : 'xxx' }));
    });
  });


  describe('.track()', function () {
    it('should get a good response from the API', function (done) {
      var track = helpers.track();
      preact.track(track, settings, done);
    });
  });

  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      preact.identify(identify, settings, done);
    });
  });

  describe('.alias()', function () {
    it('should do nothing', function (done) {
      var alias = helpers.alias();
      preact.alias(alias, settings, done);
    });
  });
});
