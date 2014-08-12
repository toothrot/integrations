
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var mapper = require('../mapper');
var time = require('unix-time');
var should = require('should');
var assert = require('assert');
var USERcycle = require('..');

describe('USERcycle', function () {
  var usercycle;
  var settings;
  var test;

  beforeEach(function(){
    usercycle = new USERcycle();
    test = Test(usercycle, __dirname);
    settings = { key: 'd6831dd4a364dd3ae36aeec48346dc58eb2a5c6e' };
  });

  it('should have the correct settings', function(){
    test
      .name('USERcycle')
      .retries(2);
  });

  describe('.mapper()', function(){
    it('should have a mapper', function(){
      assert.equal(usercycle.mapper, mapper);
    });
  });

  describe('.enabled()', function(){
    it('should only be enabled for server side messages', function(){
      test.enabled({ channel : 'server' });
      test.disabled({ channel : 'client' });
      test.disabled({});
    });
  });

  describe('mapper', function(){
    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic');
      });
    });

    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic');
      });
    });
  });

  describe('.validate()', function(){
    it('should not validate settings without a key', function(){
      var identify = helpers.identify();
      test.invalid(identify, {});
    });

    it('should validate proper identify calls', function(){
      var identify = helpers.identify();
      test.valid(identify, { key : 'x' });
    });
  });

  describe('.track()', function(){
    var track = helpers.track();
    it('should be able to track correctly', function(done){
      test
        .set(settings)
        .track(track)
        .query(mapper.track(track))
        .expects(201, done);
    });
  });

  describe('.identify()', function(){
    var identify = helpers.identify();
    it('should be able to identify correctly', function(done){
      test
        .set(settings)
        .identify(identify)
        .query(mapper.identify(identify))
        .expects(201, done);
    });
  });
});
