
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var mapper = require('../mapper');
var time = require('unix-time');
var should = require('should');
var assert = require('assert');
var Librato = require('..');

describe('Librato', function(){
  var settings;
  var librato;

  beforeEach(function(){
    settings = {
      email: 'testing+librato@segment.io',
      token: 'eb753e965bfb546525fa78bb2c9472e50c16aa573f993e953c6773ff16f4c676'
    };
    librato = new Librato(settings);
    test = Test(librato, __dirname);
  });

  it('should have correct settings', function(){
    test
      .name('Librato')
      .endpoint('https://metrics-api.librato.com/v1')
      .channels(['server', 'client', 'mobile'])
      .ensure('settings.token')
      .ensure('settings.email')
      .retries(2);
  });

  describe('.validate()', function(){
    var identify = helpers.identify();

    it('should not validate settings without an email', function(){
      test.invalid(identify, {});
      test.invalid(identify, { token: 'x' });
    });

    it('should not validate messages without a token', function(){
      test.invalid(identify, { email: 'x' });
    });

    it('should validate proper identify calls', function(){
      test.valid(identify, { email: 'x', token: 'y' });
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic');
      });

      it('should fallback value to 1 and source to .event', function(){
        test.maps('track-fallback');
      });
    });
  });

  describe('.track()', function(){
    var track = helpers.track();

    it('should track successfully', function(done){
      var event = librato.mapper.clean(track.event());
      test
        .set(settings)
        .track(track)
        .sends({
          gauges: [{
            name: event,
            value: 1,
            measure_time: time(track.timestamp()),
            source: event
          }]
        })
        .expects(200)
        .end(done);
    });

    it('defaults to reporting a 1', function(){
      var result = librato.mapper.track(track);
      result.value.should.equal(1);
    });

    it('allows reporting zeroes', function(){
      var result = librato.mapper.track.call(librato, helpers.track({
        properties: {
          value: 0
        }
      }));
      result.value.should.equal(0)
    });
  });
});
