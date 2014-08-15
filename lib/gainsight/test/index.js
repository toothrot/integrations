
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var should = require('should');
var assert = require('assert');
var Gainsight = require('..');
var Track = facade.Track;

describe('Gainsight', function(){
  var gainsight;
  var settings;
  var test;

  beforeEach(function(){
    gainsight = new Gainsight;
    test = Test(gainsight, __dirname);
    settings = { accessKey: '70a82725-e9ff-4aa3-99d3-00284d2df7cf' };
  });

  describe('.enabled()', function(){
    var Track = facade.Track;
    it('should only be enabled for all messages', function(){
      gainsight.enabled(new Track({ channel : 'server' })).should.be.ok;
      gainsight.enabled(new Track({ channel : 'client' })).should.be.ok;
      gainsight.enabled(new Track({})).should.not.be.ok;
    });
  });

  describe('.validate()', function(){
    it('should not validate settings without a accessKey', function(){
      var identify = helpers.identify();
      gainsight.validate(identify, {}).should.be.instanceOf(Error);
    });

    it('should validate proper track', function(){
      var track = helpers.track();
      should.not.exist(gainsight.validate(track, settings));
    });
  });

  describe('.track()', function(){
    it('success', function(done){
      var json = test.fixture('track-basic');
      test
        .set(settings)
        .track(json.input)
        .sends(json.output)
        .expects(200)
        .end(done);
    });

    it('should error with invalid access key', function(done){
      var json = test.fixture('track-basic');
      test
        .set({ accessKey: '1234' })
        .track(json.input)
        .sends(json.output)
        .error(done);
    });
  });

  describe('.identify()', function(){
    it('success', function(done){
      var json = test.fixture('identify-basic');
      test
        .set(settings)
        .identify(json.input)
        .sends(json.output)
        .expects(200)
        .end(done);
    });

    it('should error with invalid access key', function(done){
      var json = test.fixture('identify-basic');
      test
        .set({ accessKey: '1234' })
        .identify(json.input)
        .sends(json.output)
        .error(done);
    });
  });

  describe('.alias()', function(){
    it('success', function(done){
      var json = test.fixture('alias-basic');
      test
        .set(settings)
        .alias(json.input)
        .sends(json.output)
        .expects(200)
        .end(done);
    });

    it('should error with invalid access key', function(done){
      var json = test.fixture('alias-basic');
      test
        .set({ accessKey: '1234' })
        .alias(json.input)
        .sends(json.output)
        .error(done);
    });
  });

  describe('.group()', function(){
    it('success', function(done){
      var json = test.fixture('group-basic');
      test
        .set(settings)
        .group(json.input)
        .sends(json.output)
        .expects(200)
        .end(done);
    });

    it('should error with invalid access key', function(done){
      var json = test.fixture('group-basic');
      test
        .set({ accessKey: '1234' })
        .group(json.input)
        .sends(json.output)
        .error(done);
    });
  });

  describe('.page()', function(){
    it('success', function(done){
      var json = test.fixture('page-basic');
      test
        .set(settings)
        .page(json.input)
        .sends(json.output)
        .expects(200)
        .end(done);
    });

    it('should error with invalid access key', function(done){
      var json = test.fixture('page-basic');
      test
        .set({ accessKey: '1234' })
        .page(json.input)
        .sends(json.output)
        .error(done);
    });
  });

  describe('.screen()', function(){
    it('success', function(done){
      var json = test.fixture('screen-basic');
      test
        .set(settings)
        .screen(json.input)
        .sends(json.output)
        .expects(200)
        .end(done);
    });

    it('should error with invalid access key', function(done){
      var json = test.fixture('screen-basic');
      test
        .set({ accessKey: '1234' })
        .screen(json.input)
        .sends(json.output)
        .error(done);
    });
  });
});
