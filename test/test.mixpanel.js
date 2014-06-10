var assert = require('assert');
var auth = require('./auth');
var facade = require('segmentio-facade')
var helpers = require('./helpers');
var integrations = require('..');
var settings = auth['Mixpanel'];
var Track = facade.Track;
var test = require('segmentio-integration-tester');

/**
 * Create our integration
 */

var mixpanel = new integrations['Mixpanel']();


describe('Mixpanel', function(){

  describe('.enabled()', function(){
    it('should only be enabled for server side messages', function(){
      assert(test(mixpanel).server());
      assert(!test(mixpanel).mobile());
      assert(!test(mixpanel).client());
    });
  });

  describe('.validate()', function () {
    it('should not validate settings without a token', function(){
      var identify = helpers.identify();
      var err = mixpanel.validate(identify, {});
      assert(err instanceof Error);
    });

    it('should validate proper identify calls', function(){
      var identify = helpers.identify();
      var err = mixpanel.validate(identify, { token: 'x' });
      assert(!err);
    });

    it('should not validate old track calls without an apiKey', function(){
      var track = helpers.track({ timestamp: new Date('5/10/2013') });
      var err = mixpanel.validate(track, { token: 'x' });
      assert(err instanceof Error);
    });

    it('should validate old track calls with an apiKey', function(){
      var track = helpers.track({ timestamp: new Date('5/10/2013') });
      var err = mixpanel.validate(track, {
        token: 'x',
        apiKey: 'x'
      });
      assert(!err);
    });
  });

  describe('.track()', function () {
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

    it('should be able to track ill-formed traits', function (done) {
      mixpanel.track(helpers.track.bare({
        context: {
          traits: 'aaa'
        }
      }), settings, done);
    });
  });

  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      mixpanel.identify(identify, settings, done);
    });
  });

  describe('.alias()', function () {
    var alias = helpers.alias();
    it('should be able to alias properly', function (done) {
      mixpanel.alias(alias, settings, done);
    });
  });
});
