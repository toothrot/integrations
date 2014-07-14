var test = require('segmentio-integration-tester');
var assert = require('assert');
var auth = require('./auth');
var facade = require('segmentio-facade');
var helpers = require('./helpers');
var integrations = require('..');
var should = require('should');
var amplitude = new integrations['Amplitude']();
var settings = auth['Amplitude'];

describe('Amplitude', function() {

  describe('.enabled()', function(){
    it('should only be enabled for server side messages', function(){
      assert(test(amplitude).server());
      assert(!test(amplitude).mobile());
      assert(!test(amplitude).client());
    });
  });

  describe('.validate()', function() {
    it('should not be valid without an api key', function(){
      assert(amplitude.validate({}, {}) instanceof Error);
    });

    it('should be valid with an api key', function(){
      assert(!amplitude.validate({}, { apiKey: 'apiKey' }));
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

      test(amplitude)
        .set(settings)
        .page(page)
        .query({
          api_key: settings.apiKey,
          event: event
        })
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

      test(amplitude)
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
    it('should map screen calls correctly', function(done){
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

      test(amplitude)
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

      test(amplitude)
        .set(settings)
        .track(track)
        .query({
          api_key: settings.apiKey,
          event: event
        })
        .expects(200, done);
    });

    it('should track device info properly', function(done){
      var device = {
        manufacturer: 'manufacturer',
        model: 'model',
        brand: 'brand'
      };
      var track = {
        timestamp: new Date(),
        event: 'event',
        context: { device: device }
      };
      var event = JSON.stringify({
        time: track.timestamp.getTime(),
        user_properties: {},
        device_model: 'model',
        device_brand: 'brand',
        device_manufacturer: 'manufacturer',
        event_type: 'event',
        event_properties: {}
      });

      test(amplitude)
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