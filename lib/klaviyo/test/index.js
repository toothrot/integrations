
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var should = require('should');
var assert = require('assert');
var Klaviyo = require('..');

describe('Klaviyo', function () {
  var settings;
  var klaviyo;

  beforeEach(function(){
    klaviyo = new Klaviyo;
    klaviyo.use(helpers.mapper(__dirname));
    settings = { apiKey: 'eHdVzM' };
  });

  it('should have correct settings', function(){
    test(klaviyo)
      .name('Klaviyo')
      .endpoint('http://a.klaviyo.com/api')
      .retries(2);
  });

  describe('.enabled()', function () {
    it('should be enabled for server side messages', function(){
      test(klaviyo).enabled({ channel: 'server' });
    });

    it('should be disabled for server side messages', function(){
      test(klaviyo).disabled({ channel: 'client' });
    });
  });

  describe('.validate()', function () {
    it('should be invalid when .apiKey is missing', function(){
      delete settings.apiKey;
      test(klaviyo).invalid({}, settings);
    });

    it('should be valid when given complete settings', function(){
      test(klaviyo).valid({}, settings);
    });
  });

  describe('mapper', function(){
    describe('identify', function(){
      it('should map basic identify', function(){
        klaviyo.fixture('identify-basic', settings);
      });

      it('should fallback to anonymousId', function(){
        klaviyo.fixture('identify-anonymous-id', settings);
      });
    });

    describe('track', function(){
      it('should map basic track', function(){
        klaviyo.fixture('track-basic', settings);
      });
    });
  });

  describe('.track()', function () {
    it('should be able to track correctly', function(done){
      test(klaviyo)
        .set(settings)
        .track(helpers.track())
        .expects(200)
        .end(done);
    });

    it('should error on invalid response', function(done){
      test(klaviyo)
        .track(helpers.track())
        .error(done);
    });
  });


  describe('.identify()', function () {
    it('should be able to identify correctly', function(done){
      test(klaviyo)
        .set(settings)
        .identify(helpers.identify())
        .expects(200)
        .end(done);
    });

    it('should error on invalid response', function(done){
      test(klaviyo)
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
