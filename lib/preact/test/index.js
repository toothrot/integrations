
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var mapper = require('../mapper');
var time = require('unix-time');
var should = require('should');
var assert = require('assert');
var Preact = require('..');

describe('Preact', function(){
  var settings;
  var preact;
  var test;

  beforeEach(function(){
    settings = {
      projectCode: 'xzdp2lscug',
      apiSecret: 'fswi6mj6po'
    };
    preact = new Preact(settings);
    test = Test(preact, __dirname);
  });

  it('should have correct settings', function(){
    test
      .name('Preact')
      .endpoint('https://api.preact.io/api/v2')
      .ensure('settings.projectCode')
      .ensure('settings.apiSecret')
      .channels(['server'])
      .retries(2);
  });

  describe('.validate()', function(){
    it('should be invalid if .projectCode is missing', function(){
      delete settings.projectCode;
      test.invalid({}, settings);
    });

    it('should be invalid if .apiSecret is missing', function(){
      delete settings.apiSecret;
      test.invalid({}, settings);
    });

    it('should be valid with complete settings', function(){
      test.valid({}, settings);
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic');
      });
    });
  });

  describe('.track()', function(){
    it('should get a good response from the API', function(done){
      var track = helpers.track();
      var identify = track.identify();
      var props = track.properties();
      var extras = track.properties();

      extras._ip = track.ip();
      extras._ua = track.userAgent();

      test
        .track(track)
        .sends({
          person: {
            created_at: identify.created(),
            uid: identify.userId(),
            email: identify.email(),
            properties: identify.traits()
          },
          event: {
            name: track.event(),
            timestamp: time(track.timestamp()),
            extras: track.properties(),
            revenue: 100 * track.revenue(),
            userAgent: track.userAgent(),
            extras: extras
          },
          source: 'segmentio-server'
        })
        .expects(200, done);
    });
  });

  describe('.identify()', function(){
    it('should get a good response from the API', function(done){
      var identify = helpers.identify();
      test
        .identify(identify)
        .sends({
          person: {
            created_at: identify.created(),
            uid: identify.userId(),
            email: identify.email(),
            properties: identify.traits()
          },
          event: {
            name: '___identify'
          },
          source: 'segmentio-server'
        })
        .expects(200, done);
    });
  });
});
