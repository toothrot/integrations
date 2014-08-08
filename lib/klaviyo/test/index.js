
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var should = require('should');
var assert = require('assert');
var Klaviyo = require('..');

describe('Klaviyo', function () {
  var settings;
  var klaviyo;
  var test;

  beforeEach(function(){
    klaviyo = new Klaviyo;
    test = Test(klaviyo, __dirname);
    settings = { apiKey: 'eHdVzM' };
  });

  it('should have correct settings', function(){
    test
      .name('Klaviyo')
      .endpoint('http://a.klaviyo.com/api')
      .retries(2);
  });

  describe('.enabled()', function () {
    it('should be enabled for server side messages', function(){
      test.enabled({ channel: 'server' });
    });

    it('should be disabled for server side messages', function(){
      test.disabled({ channel: 'client' });
    });
  });

  describe('.validate()', function () {
    it('should be invalid when .apiKey is missing', function(){
      delete settings.apiKey;
      test.invalid({}, settings);
    });

    it('should be valid when given complete settings', function(){
      test.valid({}, settings);
    });
  });

  describe('mapper', function(){
    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic', settings);
      });

      it('should fallback to anonymousId', function(){
        test.maps('identify-anonymous-id', settings);
      });
    });

    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic', settings);
      });
    });
  });

  describe('.track()', function () {
    it('should be able to track correctly', function(done){
      test
        .set(settings)
        .track(helpers.track())
        .expects(200)
        .end(done);
    });

    it('should error on invalid response', function(done){
      test
        .track(helpers.track())
        .error(done);
    });
  });


  describe('.identify()', function () {
    it('should be able to identify correctly', function(done){
      test
        .set(settings)
        .identify(helpers.identify())
        .expects(200)
        .end(done);
    });

    it('should error on invalid response', function(done){
      test
        .identify(helpers.identify())
        .error(done);
    });
  });

  describe('.alias()', function () {
    it('should do nothing', function(done){
      var msg = helpers.alias();
      klaviyo.alias(msg, settings, done);
    });
  });
});
