
var test         = require('segmentio-integration-tester');
var auth         = require('./auth.json');
var facade       = require('segmentio-facade');
var helpers      = require('./helpers');
var integrations = require('..');
var should       = require('should');
var amplitude    = new integrations['Amplitude']();
var settings     = auth['Amplitude'];

describe('Amplitude', function() {
  describe('.validate()', function() {
    it('should require an api key', function() {
      amplitude.validate({}, {}).should.be.an.instanceOf(Error);
    });
  });

  describe('._format()', function(){
    var json = {};

    beforeEach(function(){
      json.context = {
        location: { latitude: 'lat', longitude: 'lng', country: 'country' },
        device: { id: 'device-id', type: 'device-type' },
        os: { name: 'os-name', version: 'os-version' },
        app: { version: 'app-version' },
        network: { carrier: 'carrier' },
        language: 'language',
      };
    })

    beforeEach(function(){
      json.integrations = {
        Amplitude: {
          eventId: 'event-id',
          eventType: 'event-type'
        }
      };
    })

    it('should format correctly', function(){
      var track = helpers.track(json);
      var props = track.properties();
      delete props.revenue;
      amplitude._format(track).should.eql({
        user_id: track.userId(),
        event_type: track.event(),
        device_id: 'device-id',
        time: +track.timestamp(),
        event_properties: props,
        user_properties: track.traits(),
        client_sdk: 'os-name',
        app_version: 'app-version',
        client_os: 'os-version',
        device_type: 'device-type',
        device_carrier: 'carrier',
        country: 'country',
        language: 'language',
        revenue: track.revenue(),
        location_lat: 'lat',
        location_lng: 'lng',
        ip: track.ip(),
        event_id: 'event-id',
        amplitude_event_type: 'event-type',
      });
    })
  })

  describe('.track()', function() {
    it('should be able to track correctly', function(done) {
      test(amplitude)
        .track(helpers.track())
        .set(settings)
        .expects(200, done);
    });
  });
});
