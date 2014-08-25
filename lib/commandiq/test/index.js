
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var assert = require('assert');
var should = require('should');
var CommandIQ = require('..');

describe('CommandIQ', function(){
  var settings;
  var test;
  var ciq;

  beforeEach(function(){
    settings = { apiKey: 'hokaisjzaacdxlpaixf4f4yaev' };
    ciq = new CommandIQ(settings);
    test = Test(ciq, __dirname);
  });

  it('should have correct settings', function(){
    test
      .name('CommandIQ')
      .endpoint('http://api.commandiq.com/api')
      .channels(['server', 'mobile', 'client'])
      .ensure('settings.apiKey')
      .retries(2);
  });

  describe('.validate()', function(){
    it('should require an apiKey', function(){
      test.invalid({}, {});
      test.invalid({}, { apiKey: null });
    });

    it('should validate with the required settings', function(){
      test.valid({}, { apiKey : 'xxx' });
    });
  });

  describe('.track()', function(){
    it('should get a good response from the API', function(done){
      var json = test.fixture('track-basic');
      test
        .set(settings)
        .track(json.input)
        .sends(json.output)
        .expects(200)
        .end(done);
    });

    it('should fallback to anonymousId', function(done){
      var json = test.fixture('track-anon');
      test
        .set(settings)
        .track(json.input)
        .sends(json.output)
        .expects(200)
        .end(done);
    });

    it('should error when keys are incorrect', function(done){
      var json = test.fixture('track-anon');
      test
        .set({ apiKey: 'foo' })
        .track(json.input)
        .sends(json.output)
        .error(done);
    });
  });

  describe('.identify()', function(){
    it('should get a good response from the API', function(done){
      var json = test.fixture('identify-basic');
      test
        .set(settings)
        .identify(json.input)
        .sends(json.output)
        .end(done);
    });

    it('should fallback to anonymousId', function(done){
      var json = test.fixture('identify-anon');
      test
        .set(settings)
        .identify(json.input)
        .sends(json.output)
        .end(done);
    });

    it('should error when keys are incorrect', function(done){
      var json = test.fixture('identify-anon');
      test
        .set({ apiKey: 'foo' })
        .identify(json.input)
        .sends(json.output)
        .error(done);
    });
  });
});
