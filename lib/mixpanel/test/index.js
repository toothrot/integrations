
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
      var msg = helpers.identify();

      var payload = {
        $distinct_id: msg.userId(),
        $token: '89f86c4aa2ce5b74cb47eb5ec95ad1f9',
        $time: msg.timestamp().getTime(),
        $set: {
          fat: 0.02,
          company: 'Segment.io',
          city: 'San Francisco',
          state: 'CA',
          websites: [
            'http://calv.info',
            'http://ianstormtaylor.com',
            'http://ivolo.me',
            'http://rein.pk'
          ],
          bad: null,
          alsoBad: undefined,
          met: msg.proxy('traits.met'),
          userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)',
          id: msg.userId(),
          $first_name: 'John',
          $last_name: 'Doe',
          $email: msg.email(),
          $phone: '5555555555',
          $created: msg.created().toISOString().slice(0, 19)
        },
        $ip: '12.212.12.49',
        $ignore_time: false,
        mp_lib: 'Segment.io'
      };

      var data = new Buffer(JSON.stringify(payload)).toString('base64');

      test
        .set(settings)
        .identify(msg)
        .query({ ip: 0 })
        .query({ verbose: 1 })
        .query({ data: data })
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
      var msg = {
        userId: 'user-id',
        event: 'my-event',
        timestamp: new Date,
        properties: {
          searchEngine: 'google',
          username: 'jd',
          email: 'jd@example.com',
          referrer: 'someone',
          query: 'analytics'
        },
        context: {
          ip: '0.0.0.0'
        }
      };

      var payload = {
        event: 'my-event',
        properties: {
          email: 'jd@example.com',
          token: settings.token,
          distinct_id: msg.userId,
          time: time(msg.timestamp),
          mp_lib: 'Segment.io',
          $search_engine: 'google',
          $referrer: 'someone',
          $username: 'jd',
          ip: '0.0.0.0',
          mp_name_tag: msg.userId,
          id: msg.userId,
        }
      };

      var data = new Buffer(JSON.stringify(payload)).toString('base64');

      test
        .set(settings)
        .set({ people: false })
        .track(msg)
        .query({ verbose: '1' })
        .query({ data: data })
        .query({ api_key: settings.apiKey })
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
    var alias = helpers.alias();
    it('should be able to alias properly', function(done){
      mixpanel.alias(alias, settings, done);
    });
  });
});
