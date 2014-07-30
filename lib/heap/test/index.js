
var test = require('segmentio-integration-tester');
var facade = require('segmentio-facade');
var helpers = require('../../../test/helpers');
var assert = require('assert');
var should = require('should');
var Track = facade.Track;
var Heap = require('..');

describe('Heap', function () {
  var heap;
  var settings;
  var payload;

  beforeEach(function(){
    heap = new Heap;
    payload = {};
    settings = { apiKey: '1535634150' };
  });

  it('should the correct settings', function(){
    test(heap)
      .name('Heap')
      .endpoint('https://heapanalytics.com/api')
      .retries(2);
  });

  describe('.enabled()', function () {
    it('should be enabled for server side messages', function(){
      test(heap).enabled({ channel: 'server' });
    });

    it('should not be enabled on other channels', function(){
      test(heap).disabled({ channel: 'client' });
    });
  });

  describe('.validate()', function () {
    it('should be invalid without apiKey', function () {
      test(heap).invalid({}, {});
    });

    it('should be valid with apiKey', function () {
      test(heap).valid({}, settings);
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map correctly', function(){
        var msg = helpers.track();
        var payload = heap.mapper.track(msg, settings);
        assert.deepEqual(payload, {
          app_id: settings.apiKey,
          identity: msg.email(),
          event: msg.event(),
          properties: msg.properties()
        });
      });

      it('should fallback to .username() if .email() is missing', function(){
        var props = { username: 'username' };
        var msg = new Track({ properties: props });
        var payload = heap.mapper.track(msg, settings);
        assert.equal('username', payload.identity);
      });

      it('should fallback to .userId() if .username() is missing', function(){
        var msg = new Track({ userId: 'user-id' });
        var payload = heap.mapper.track(msg, settings);
        assert.equal('user-id', payload.identity);
      });
    });
  });

  describe('.track()', function () {
    it('should send track correctly', function (done) {
      var track = helpers.track();

      payload.identity = track.email();
      payload.properties = track.properties();
      payload.event = track.event();
      payload.app_id = settings.apiKey;

      test(heap)
        .set(settings)
        .track(track)
        .sends(payload)
        .expects(200, done);
    });
  });
});
