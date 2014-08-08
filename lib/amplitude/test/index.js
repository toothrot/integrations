
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
      var page = {
        name: 'name',
        timestamp: new Date()
      };
      var event = JSON.stringify({
        time: page.timestamp.getTime(),
        user_properties: {},
        event_type: 'Viewed name Page',
        event_properties: { name: 'name' }
      });

      test
        .set(settings)
        .page(page)
        .query({ api_key: settings.apiKey })
        .query({ event: event })
        .expects(200, done);
    });

    it('should record page calls with bad fields correctly', function(done){
      amplitude.page(helpers.page(), settings, done);
    });
  });

  describe('.screen()', function(){
    it('should map screen calls correctly', function(done){
      var screen = {
        name: 'name',
        timestamp: new Date()
      };
      var event = JSON.stringify({
        time: screen.timestamp.getTime(),
        user_properties: {},
        event_type: 'Viewed name Screen',
        event_properties: {
          name: 'name'
        }
      });

      test
        .set(settings)
        .screen(screen)
        .query({
          api_key: settings.apiKey,
          event: event
        })
        .expects(200, done);
    });

    it('should be able to process screen calls with bad fields', function(done) {
      amplitude.screen(helpers.screen(), settings, done);
    });
  });

  describe('.track()', function() {
    it('should map track calls correctly', function(done){
      var track = {
        event: 'event',
        properties: {
          revenue: 42
        },
        timestamp: new Date()
      };
      var event = JSON.stringify({
        time: track.timestamp.getTime(),
        user_properties: {},
        revenue: 42,
        event_type: 'event',
        event_properties: {}
      });

      test
        .set(settings)
        .track(track)
        .query({
          api_key: settings.apiKey,
          event: event
        })
        .expects(200, done);
    });

    it('should track amplitude properties properly', function(done){
      var track = {
        timestamp: new Date(),
        event: 'event',
        options: {
          Amplitude: {
            event_id: 'foo',
            event_type: 'type',
            session_id: 1234
          }
        }
      };
      var event = JSON.stringify({
        time: track.timestamp.getTime(),
        user_properties: {},
        amplitude_event_type: 'type',
        session_id: 1234,
        event_id: 'foo',
        event_type: 'event',
        event_properties: {}
      });

      test
        .set(settings)
        .track(track)
        .query({
          api_key: settings.apiKey,
          event: event
        })
        .expects(200, done);
    });

    it('should track context properly', function(done){
      var device = {
        manufacturer: 'manufacturer',
        model: 'model',
        brand: 'brand'
      };
      var track = {
        timestamp: new Date(),
        event: 'event',
        context: { device: device, locale: 'en-US' }
      };
      var event = JSON.stringify({
        time: track.timestamp.getTime(),
        user_properties: {},
        device_model: 'model',
        device_brand: 'brand',
        device_manufacturer: 'manufacturer',
        language: 'English',
        country: 'United States',
        event_type: 'event',
        event_properties: {}
      });

      test
        .set(settings)
        .track(track)
        .query({
          api_key: settings.apiKey,
          event: event
        })
        .expects(200, done);
    });

    it('should be able to track correctly', function(done) {
      amplitude.track(helpers.track(), settings, done);
    });
  });
});
