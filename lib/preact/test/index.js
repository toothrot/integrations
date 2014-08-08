
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
    preact = new Preact;
    test = Test(preact, __dirname);
    settings = {
      projectCode: 'xzdp2lscug',
      apiSecret: 'fswi6mj6po'
    };
  });

  it('should have correct settings', function(){
    test
      .name('Preact')
      .endpoint('https://api.preact.io/api/v2')
      .retries(2);
  });

  it('should use the mapper', function(){
    assert.equal(preact.mapper, mapper);
  });

  describe('.enabled()', function(){
    it('should only be enabled for server side messages', function(){
      test.enabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'server'
      }));

      test.disabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'client'
      }));

      test.disabled(new facade.Track({
        userId: 'calvin@segment.io'
      }));
    });

    it('should only be enabled for messages with an email', function(){
      test.enabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'server'
      }));

      test.enabled(new facade.Track({
        channel: 'server'
      }));
    });
  });

  describe('.validate()', function(){
    it('should require a projectCode', function(){
      test.invalid({}, { projectCode: '' });
      test.invalid({}, { projectCode: '', apiSecret: 'xxx' });
    });

    it('should require an apiSecret', function(){
      test.invalid({}, { apiSecret: '' });
      test.invalid({}, { apiSecret: '', projectCode: 'xxx' });
    });

    it('should validate with the required settings', function(){
      test.valid({}, { projectCode: 'xxx', apiSecret: 'xxx' });
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
        .set(settings)
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
        .set(settings)
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

  describe('.alias()', function(){
    it('should do nothing', function(done){
      var alias = helpers.alias();
      test
        .set(settings)
        .alias(alias)
        .requests(0)
        .end(done);
    });
  });
});
