
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var time = require('unix-time');
var should = require('should');
var assert = require('assert');
var Iterable = require('..');

describe('Iterable', function(){
  var settings;
  var iterable;
  var payload;
  var test;

  beforeEach(function(){
    payload = {};
    settings = { apiKey: 'a1b0ad8c09cb419498ab90c2b005ed6a' };
    iterable = new Iterable(settings);
    test = Test(iterable, __dirname);
  });

  it('should have correct settings', function(){
    test
      .name('Iterable')
      .endpoint('https://api.iterable.com/api')
      .channels(['server', 'mobile', 'client'])
      .ensure('settings.apiKey')
      .ensure('message.email')
      .retries(2);
  });

  describe('.validate()', function(){
    var msg;

    beforeEach(function(){
      msg = {
        properties: {
          email: 'jd@example.com'
        }
      };
    });

    it('should be invalid when .apiKey is missing', function(){
      delete settings.apiKey;
      test.invalid(msg, settings);
    });

    it('should be invalid when .email is missing', function(){
      delete msg.properties.email;
      test.invalid(msg, settings);
    });

    it('should be valid when .apiKey is given', function(){
      test.valid(msg, settings);
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic');
      });
    });

    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic');
      });
    });
  });

  describe('.track()', function(){
    it('should get a good response from the API', function (done) {
      test
        .set(settings)
        .track(helpers.track())
        .expects(200)
        .end(done);
    });
  });

  describe('.identify()', function(){
    it('should get a good response from the API', function (done) {
      test
        .set(settings)
        .identify(helpers.identify())
        .expects(200)
        .end(done);
    });
  });

  describe('.alias()', function(){
    it('should do nothing', function (done) {
      var alias = helpers.alias();
      iterable.alias(alias, settings, done);
    });
  });
});
