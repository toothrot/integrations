
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var mapper = require('../mapper');
var should = require('should');
var assert = require('assert');
var Outbound = require('..');

describe('Outbound', function(){
  var outbound;
  var settings;
  var test;

  beforeEach(function(){
    settings = { apiKey: '950a9fc29b1d65815f4aec077944600a' };
    outbound = new Outbound(settings);
    test = Test(outbound, __dirname);
  });

  it('should have correct settings', function(){
    test
      .name('Outbound')
      .channels(['server', 'mobile', 'client'])
      .endpoint('https://api.outbound.io')
      .ensure('settings.apiKey')
      .ensure('message.userId')
      .retries(2);
  });

  describe('.validate()', function(){
    var msg;

    beforeEach(function(){
      msg = { userId: 'user-id' };
    });

    it('should be invalid when .apiKey is missing', function(){
      delete settings.apiKey;
      test.invalid(msg, settings);
    });

    it('should be invalid when .userId is missing', function(){
      delete msg.userId;
      test.invalid(msg, settings);
    });

    it('should be valid when settings are complete and .userId is given', function(){
      test.valid(msg, settings);
    });
  });

  describe('.track()', function(){
    it('should track successfully', function(done){
      var track = helpers.track();
      test
        .track(track)
        .sends({
          user_id: track.userId(),
          event: track.event(),
          properties: track.properties()
        })
        .expects(200)
        .end(done);
    });
  });

  describe('.identify()', function(){
    it('should identify successfully', function(done){
      var identify = helpers.identify();
      test
        .identify(identify)
        .sends({
          user_id: identify.userId(),
          attributes: identify.traits(),
          phone_number: identify.phone(),
          last_name: identify.lastName(),
          first_name: identify.firstName(),
          email: identify.email()
        })
        .expects(200)
        .end(done);
    });

    it('should identify with an android device token', function(done){
      var identify = helpers.identify({ context : {
        library : {
          name: 'analytics-android',
          version: '0.6.2'
        },
        device : {
          token: 'asdfasdf'
        }
      }});
      test
        .identify(identify)
        .sends({
          user_id: identify.userId(),
          attributes: identify.traits(),
          phone_number: identify.phone(),
          last_name: identify.lastName(),
          first_name: identify.firstName(),
          email: identify.email(),
          gcm: ['asdfasdf']
        })
        .expects(200)
        .end(done);
    });

    it('should identify with an ios device token', function(done){
      var identify = helpers.identify({ context : {
        library : {
          name: 'analytics-ios',
          version: '0.6.2'
        },
        device : {
          token: 'asdfasdf'
        }
      }});
      test
        .identify(identify)
        .sends({
          user_id: identify.userId(),
          attributes: identify.traits(),
          phone_number: identify.phone(),
          last_name: identify.lastName(),
          first_name: identify.firstName(),
          email: identify.email(),
          apns: ['asdfasdf']
        })
        .expects(200)
        .end(done);
    });
  });
});


// Outbound v1
// TODO REMOVE

describe('Outbound-V1', function(){
  var outbound;
  var settings;
  var test;

  beforeEach(function(){
    settings = { apiKey: 'f4f15f2f004fa0bd2140b4db93cbb538', v1: true };
    outbound = new Outbound(settings);
    test = Test(outbound, __dirname);
  });

  it('should have correct settings', function(){
    test
      .name('Outbound')
      .endpoint('https://api.outbound.io')
      .channels(['server', 'mobile', 'client'])
      .endpoint('https://api.outbound.io')
      .ensure('settings.apiKey')
      .ensure('message.userId')
      .retries(2);
  });

  describe('.validate()', function(){
    var msg;

    beforeEach(function(){
      msg = { userId: 'user-id' };
    });

    it('should be invalid when .apiKey is missing', function(){
      delete settings.apiKey;
      test.invalid(msg, settings);
    });

    it('should be invalid when .userId is missing', function(){
      delete msg.userId;
      test.invalid(msg, settings);
    });

    it('should be valid when settings are complete and .userId is given', function(){
      test.valid(msg, settings);
    });
  });

  describe('.track()', function(){
    it('should track successfully', function(done){
      var track = helpers.track();
      test
        .track(track)
        .sends({
          user_id: track.userId(),
          event: track.event(),
          payload: track.properties(),
          api_key: settings.apiKey
        })
        .expects(200)
        .end(done);
    });
  });

  describe('.identify()', function(){
    it('should identify successfully', function(done){
      var identify = helpers.identify();
      test
        .identify(identify)
        .sends({
          user_id: identify.userId(),
          traits: identify.traits(),
          api_key: settings.apiKey
        })
        .expects(200)
        .end(done);
    });
  });
});
