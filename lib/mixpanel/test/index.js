
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var assert = require('assert');
var time = require('unix-time');
var Mixpanel = require('..');

describe('Mixpanel', function(){
  var mixpanel;
  var settings;
  var test;

  beforeEach(function(){
    mixpanel = new Mixpanel;
    test = Test(mixpanel, __dirname);
    settings = {
      apiKey: 'a0dead853f1a64fe59da98174065442f',
      secret: '202897e51c36d40a2b9074fc157f1166',
      token: '89f86c4aa2ce5b74cb47eb5ec95ad1f9',
      people: true
    };
  });

  it('should have correct settings', function(){
    test
      .name('Mixpanel')
      .endpoint('https://api.mixpanel.com')
      .retries(2);
  });

  describe('.enabled()', function(){
    it('should be enabled for server side messages', function(){
      test.enabled({ channel: 'server' });
    });

    it('should be disabled for other channels', function(){
      test.disabled({ channel: 'client' });
      test.disabled({ channel: 'mobile' });
    });
  });

  describe('.validate()', function(){
    it('should be invalid when .token is missing', function(){
      delete settings.token;
      test.invalid({}, settings);
    });

    it('should be invalid for old "track" messages without .apiKey', function(){
      delete settings.apiKey;
      test.invalid({
        type: 'track',
        timestamp: new Date('5/10/2014')
      }, settings);
    });

    it('should be valid for new "track" messages without .apiKey', function(){
      delete settings.apiKey;
      test.valid({
        type: 'track',
        timestamp: new Date
      }, settings);
    });

    it('should be valid when all settings are given', function(){
      test.valid({}, settings);
    });
  });

  describe('.identify()', function(){
    it('should do nothing if `.people` is false', function(done){
      var msg = helpers.identify();
      settings.people = false;
      mixpanel.identify(msg, settings, function(){
        assert.equal(0, arguments.length);
        done();
      });
    });

    it('should send identify correctly', function(done){
      var json = test.fixture('identify-basic');
      test
        .set(settings)
        .identify(json.input)
        .query({ ip: 0, verbose: 1 })
        .query('data', json.output, decode)
        .expects(200)
        .end(done);
    });

    it('should be able to identify correctly', function(done){
      var msg = helpers.identify();
      mixpanel.identify(msg, settings, done);
    });
  });

  describe('.track()', function(){
    it('should send track correctly', function(done){
      var json = test.fixture('track-basic');
      test
        .set(settings)
        .set({ people: false })
        .track(json.input)
        .query({ api_key: settings.apiKey })
        .query({ verbose: '1' })
        .query('data', json.output, decode)
        .end(function(err, res){
          if (err) return done(err);
          assert.equal(1, res.length);
          assert.equal(200, res[0].status);
          done();
        });
    });

    it('should be able to track correctly', function(done){
      mixpanel.track(helpers.track(), settings, done);
    });

    it('should be able to track a bare call', function(done){
      mixpanel.track(helpers.track.bare(), settings, done);
    });

    it('should increment', function(done){
      var opts = {};
      for (var k in settings) opts[k] = settings[k];
      var track = helpers.track({ event: 'increment' });
      opts.increments = [track.event()];
      mixpanel.track(track, opts, done);
    })

    it('should be able to track ill-formed traits', function(done){
      mixpanel.track(helpers.track.bare({
        context: {
          traits: 'aaa'
        }
      }), settings, done);
    });
  });

  describe('.alias()', function(){
    it('should be able to alias properly', function(done){
      var json = test.fixture('alias-basic');
      test
        .set(settings)
        .alias(json.input)
        .query('data', json.output, decode)
        .query('api_key', settings.apiKey)
        .query('verbose', '1')
        .query('ip', '0')
        .expects(200)
        .end(done);
    });
  });

  describe('.page()', function(){
    it('should be able to track basic page', function(done){
      var json = test.fixture('page-basic');
      test
        .set(settings)
        .page(json.input)
        .query('data', json.output, decode)
        .query('api_key', settings.apiKey)
        .query('verbose', '1')
        .end(function(err, res){
          if (err) return done(err);
          // TODO: this is awkward, remove this once
          // we add mutliple request support to tester
          // and change all integrations to supply an
          // array of responses to the callback.
          assert.equal(200, res[1].status);
          done();
        });
    });

    it('should be able to track complex page', function(done){
      var json = test.fixture('page-complex');
      test
        .set(settings)
        .page(json.input)
        .query('data', json.output, decode)
        .query('api_key', settings.apiKey)
        .query('verbose', '1')
        .end(function(err, res){
          if (err) return done(err);
          // TODO: this is awkward, remove this once
          // we add mutliple request support to tester
          // and change all integrations to supply an
          // array of responses to the callback.
          assert.equal(200, res[1].status);
          done();
        });
    });
  });

  describe('.screen()', function(){
    it('should be able to track basic screen', function(done){
      var json = test.fixture('screen-basic');
      test
        .set(settings)
        .screen(json.input)
        .query('data', json.output, decode)
        .query('api_key', settings.apiKey)
        .query('verbose', '1')
        .end(function(err, res){
          if (err) return done(err);
          // TODO: this is awkward, remove this once
          // we add mutliple request support to tester
          // and change all integrations to supply an
          // array of responses to the callback.
          assert.equal(200, res[1].status);
          done();
        });
    });

    it('should be able to track complex screen', function(done){
      var json = test.fixture('screen-complex');
      test
        .set(settings)
        .screen(json.input)
        .query('data', json.output, decode)
        .query('api_key', settings.apiKey)
        .query('verbose', '1')
        .end(function(err, res){
          if (err) return done(err);
          // TODO: this is awkward, remove this once
          // we add mutliple request support to tester
          // and change all integrations to supply an
          // array of responses to the callback.
          assert.equal(200, res[1].status);
          done();
        });
    });
  });
});

/**
 * Decode base64 and parse json
 */

function decode(data){
  var buf = new Buffer(data, 'base64');
  return JSON.parse(buf.toString());
}
