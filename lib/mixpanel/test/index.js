
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var assert = require('assert');
var Mixpanel = require('..');

describe('Mixpanel', function(){
  var mixpanel;
  var settings;

  beforeEach(function(){
    mixpanel = new Mixpanel;
    settings = {
      apiKey: 'a0dead853f1a64fe59da98174065442f',
      secret: '202897e51c36d40a2b9074fc157f1166',
      token: '89f86c4aa2ce5b74cb47eb5ec95ad1f9',
      people: true
    };
  });

  it('should have correct settings', function(){
    test(mixpanel)
      .name('Mixpanel')
      .endpoint('https://api.mixpanel.com')
      .retries(2);
  });

  describe('.enabled()', function(){
    it('should be enabled for server side messages', function(){
      test(mixpanel).enabled({ channel: 'server' });
    });

    it('should be disabled for other channels', function(){
      test(mixpanel).disabled({ channel: 'client' });
      test(mixpanel).disabled({ channel: 'mobile' });
    });
  });

  describe('.validate()', function () {
    it('should be invalid when .token is missing', function(){
      delete settings.token;
      test(mixpanel).invalid({}, settings);
    });

    it('should be invalid for old "track" messages without .apiKey', function(){
      delete settings.apiKey;
      test(mixpanel).invalid({
        type: 'track',
        timestamp: new Date('5/10/2014')
      }, settings);
    });

    it('should be valid for new "track" messages without .apiKey', function(){
      delete settings.apiKey;
      test(mixpanel).valid({
        type: 'track',
        timestamp: new Date
      }, settings);
    });

    it('should be valid when all settings are given', function(){
      test(mixpanel).valid({}, settings);
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
