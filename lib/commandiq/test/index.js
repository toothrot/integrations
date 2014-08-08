
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var assert = require('assert');
var should = require('should');
var CommandIQ = require('..');

describe('CommandIQ', function () {
  var settings;
  var test;
  var ciq;

  beforeEach(function(){
    ciq = new CommandIQ;
    settings = { apiKey: 'hokaisjzaacdxlpaixf4f4yaev' };
    test = Test(ciq, __dirname);
  });

  describe('.enabled()', function () {
    it('should be enabled for all messages', function(){
      test.enabled({ channel: 'server' });
      test.enabled({ channel: 'client' });
      test.enabled({ channel: 'mobile' });
    });
  });

  describe('.validate()', function () {
    it('should require an apiKey', function () {
      test.invalid({}, {});
      test.invalid({}, { apiKey: '' });
    });

    it('should validate with the required settings', function () {
      test.valid({}, { apiKey : 'xxx' });
    });
  });

  describe('.track()', function () {
    it('should get a good response from the API', function (done) {
      var track = helpers.track();
      ciq.track(track, settings, done);
    });
  });

  describe('.identify()', function () {
    it('should get a good response from the API', function (done) {
      var identify = helpers.identify();
      ciq.identify(identify, settings, done);
    });
  });

  describe('.alias()', function () {
    it('should do nothing', function (done) {
      ciq.alias({}, {}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});
