
var Test = require('segmentio-integration-tester');
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
  var test;

  beforeEach(function(){
    payload = {};
    settings = { apiKey: '1535634150' };
    heap = new Heap(settings);
    test = Test(heap, __dirname);
  });

  it('should the correct settings', function(){
    test
      .name('Heap')
      .endpoint('https://heapanalytics.com/api')
      .ensure('settings.apiKey')
      .channels(['mobile', 'server'])
      .retries(2);
  });

  describe('.validate()', function () {
    it('should be invalid without apiKey', function () {
      test.invalid({}, {});
    });

    it('should be valid with apiKey', function () {
      test.valid({}, settings);
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map correctly', function(){
        test.maps('track-basic');
      });

      it('should fallback to .username() if .email() is missing', function(){
        test.maps('track-username');
      });

      it('should fallback to .userId() if .username() is missing', function(){
        test.maps('track-id');
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

      test
        .set(settings)
        .track(track)
        .sends(payload)
        .expects(200, done);
    });
  });
});
