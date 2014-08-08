
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
        test(heap, __dirname).fixture('track-basic');
      });

      it('should fallback to .username() if .email() is missing', function(){
        test(heap, __dirname).fixture('track-username');
      });

      it('should fallback to .userId() if .username() is missing', function(){
        test(heap, __dirname).fixture('track-id');
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
