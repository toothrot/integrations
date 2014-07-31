
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var time = require('unix-time');
var should = require('should');
var assert = require('assert');
var Iterable = require('..');

describe('Iterable', function () {
  var settings;
  var iterable;
  var payload;

  beforeEach(function(){
    iterable = new Iterable;
    payload = {};
    settings = { apiKey: 'a1b0ad8c09cb419498ab90c2b005ed6a' };
  });

  it('should have correct settings', function(){
    test(iterable)
      .name('Iterable')
      .endpoint('https://api.iterable.com/api')
      .retries(2);
  });

  describe('.enabled()', function () {
    it('should be enabled on all channels', function(){
      test(iterable).all({ userId: 'test@segment.io' });
    });

    it('should be disabled if .email is not given', function(){
      test(iterable).disabled({
        channel: 'server'
      });
    });
  });

  describe('.validate()', function () {
    it('should be invalid when .apiKey is missing', function(){
      delete settings.apiKey;
      test(iterable).invalid({}, settings);
    });

    it('should be valid when .apiKey is given', function(){
      test(iterable).valid({}, settings);
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map basic track', function(){
        test(iterable, __dirname).fixture('track-basic');
      });
    });

    describe('identify', function(){
      it('should map basic identify', function(){
        test(iterable, __dirname).fixture('identify-basic');
      });
    });
  });

  describe('.track()', function () {
    it('should get a good response from the API', function (done) {
      test(iterable)
        .set(settings)
        .track(helpers.track())
        .expects(200)
        .end(done);
    });
  });

  describe('.identify()', function () {
    it('should get a good response from the API', function (done) {
      test(iterable)
        .set(settings)
        .identify(helpers.identify())
        .expects(200)
        .end(done);
    });
  });

  describe('.alias()', function () {
    it('should do nothing', function (done) {
      var alias = helpers.alias();
      iterable.alias(alias, settings, done);
    });
  });
});
