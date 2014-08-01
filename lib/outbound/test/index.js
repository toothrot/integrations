
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var mapper = require('../mapper');
var should = require('should');
var assert = require('assert');
var Outbound = require('..');

describe('Outbound', function () {
  var outbound;
  var settings;

  beforeEach(function(){
    outbound = new Outbound;
    settings = { apiKey: 'f4f15f2f004fa0bd2140b4db93cbb538' };
  });

  it('should have correct settings', function(){
    test(outbound)
      .name('Outbound')
      .endpoint('http://api.outbound.io/api/v1')
      .retries(2);
  });

  it('should use the mapper', function(){
    assert.equal(outbound.mapper, mapper);
  });

  describe('.enabled()', function(){
    it('should only be enabled for all messages', function(){
      test(outbound).enabled(new facade.Track({ channel : 'server' }));
      test(outbound).enabled(new facade.Track({ channel : 'client' }));
      test(outbound).enabled(new facade.Track({}));
    });
  });

  describe('.validate()', function(){
    it('should require an api key', function(){
      test(outbound).invalid({}, { apiKey : '' });
      test(outbound).invalid({}, {});
      test(outbound).valid({}, { apiKey : 'xxx' });
    });
  });

  describe('.track()', function(){
    it('should track successfully', function(done){
      var identify = helpers.identify();
      test(outbound)
        .set(settings)
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

  describe('.identify()', function(){
    it('should identify successfully', function(done){
      var identify = helpers.identify();
      test(outbound)
        .set(settings)
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


  describe('.alias()', function(){
    it('should do nothing', function(done){
      var alias = helpers.alias();
      test(outbound)
        .set(settings)
        .alias(alias)
        .requests(0)
        .end(done);
    });
  });
});
