
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var mapper = require('../mapper');
var assert = require('assert');
var Amplitude = require('..');

describe('Amplitude', function() {
  var amplitude;
  var settings;
  var test;

  beforeEach(function(){
    settings = { apiKey: 'ad3c426eb736d7442a65da8174bc1b1b' };
    amplitude = new Amplitude;
    test = Test(amplitude, __dirname);
  });

  it('should have the correct settings', function(){
    test
      .name('Amplitude')
      .retries(2);
  });

  describe('.enabled()', function(){
    it('should only be enabled for server side messages', function(){
      test.enabled({ channel: 'server' });
    });

    it('should be disabled for all other channels', function(){
      test.disabled({ channel: 'mobile' });
      test.disabled({ channel: 'client' });
    });
  });

  describe('.validate()', function() {
    it('should not be valid without an api key', function(){
      test.invalid({}, {});
    });

    it('should be valid with an api key', function(){
      test.valid({}, { apiKey: 'apiKey' });
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic');
      });

      it('should map full track', function(){
        test.maps('track-full');
      });
    });

    describe('page', function(){
      it('should map basic page', function(){
        test.maps('page-basic');
      });

      it('should map full page', function(){
        test.maps('page-full');
      });
    });

    describe('screen', function(){
      it('should map basic screen', function(){
        test.maps('screen-basic');
      });

      it('should map full screen', function(){
        test.maps('screen-full');
      });
    });

    it('should remove `event_id`, `revenue`, `language` and `amplitude_event_type` from properties', function(){
      test.maps('clean');
    });
  });

  describe('.page()', function() {
    it('should map page calls correctly', function(done) {
      var json = test.fixture('page-basic');
      test
        .set(settings)
        .page(json.input)
        .query('api_key', settings.apiKey)
        .query('event', json.output, JSON.parse)
        .expects(200, done);
    });

    it('should record page calls with bad fields correctly', function(done){
      amplitude.page(helpers.page(), settings, done);
    });
  });

  describe('.screen()', function(){
    it('should map screen calls correctly', function(done){
      var json = test.fixture('screen-basic');
      test
        .set(settings)
        .screen(json.input)
        .query('api_key', settings.apiKey)
        .query('event', json.output, JSON.parse)
        .expects(200, done);
    });

    it('should be able to process screen calls with bad fields', function(done) {
      amplitude.screen(helpers.screen(), settings, done);
    });
  });

  describe('.track()', function() {
    it('should map track calls correctly', function(done){
      var json = test.fixture('track-basic');
      test
        .set(settings)
        .track(json.input)
        .query('api_key', settings.apiKey)
        .query('event', json.output, JSON.parse)
        .expects(200, done);
    });

    it('should track amplitude properties properly', function(done){
      var json = test.fixture('track-full');
      test
        .set(settings)
        .track(json.input)
        .query('api_key', settings.apiKey)
        .query('event', json.output, JSON.parse)
        .expects(200, done);
    });

    it('should track context properly', function(done){
      var json = test.fixture('track-full');
      test
        .set(settings)
        .track(json.input)
        .query('api_key', settings.apiKey)
        .query('event', json.output, JSON.parse)
        .expects(200, done);
    });
  });
});
