
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var assert = require('assert');
var should = require('should');
var CommandIQ = require('..');

describe('CommandIQ', function () {
  var settings;
  var ciq;

  beforeEach(function(){
    ciq = new CommandIQ;
    settings = { apiKey: 'hokaisjzaacdxlpaixf4f4yaev' };
  });

  it('should have correct settings', function(){
    test(ciq)
      .name('CommandIQ')
      .option('apiKey', { required: true })
      .channels(['client', 'server', 'mobile'])
      .retries(2);
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
