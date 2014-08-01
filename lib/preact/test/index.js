
var test = require('segmentio-integration-tester');
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

  beforeEach(function(){
    preact = new Preact;
    settings = {
      projectCode: 'xzdp2lscug',
      apiSecret: 'fswi6mj6po'
    };
  });

  it('should have correct settings', function(){
    test(preact)
      .name('Preact')
      .endpoint('https://api.preact.io/api/v2')
      .retries(2);
  });

  it('should use the mapper', function(){
    assert.equal(preact.mapper, mapper);
  });

  describe('.enabled()', function(){
    it('should only be enabled for server side messages', function(){
      test(preact).enabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'server'
      }));

      test(preact).disabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'client'
      }));

      test(preact).disabled(new facade.Track({
        userId: 'calvin@segment.io'
      }));
    });

    it('should only be enabled for messages with an email', function(){
      test(preact).enabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'server'
      }));

      test(preact).enabled(new facade.Track({
        channel: 'server'
      }));
    });
  });


  describe('.validate()', function(){
    it('should require a projectCode', function(){
      test(preact).invalid({}, { projectCode: '' });
      test(preact).invalid({}, { projectCode: '', apiSecret: 'xxx' });
    });

    it('should require an apiSecret', function(){
      test(preact).invalid({}, { apiSecret: '' });
      test(preact).invalid({}, { apiSecret: '', projectCode: 'xxx' });
    });

    it('should validate with the required settings', function(){
      test(preact).valid({}, { projectCode: 'xxx', apiSecret: 'xxx' });
    });
  });


  describe('.track()', function(){
    it('should get a good response from the API', function(done){
      var track = helpers.track();
      var identify = track.identify();
      var props = track.properties();
      test(preact)
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
            _ip: track.ip(),
          },
          source: 'segmentio-server'
        })
        .expects(200, done);
    });
  });


  describe('.identify()', function(){
    it('should get a good response from the API', function(done){
      var identify = helpers.identify();
      test(preact)
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
      test(preact)
        .set(settings)
        .alias(alias)
        .requests(0)
        .end(done);
    });
  });
});
