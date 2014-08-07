
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var mapper = require('../mapper');
var assert = require('assert');
var Identify = facade.Identify;
var Track = facade.Track;
var Drip = require('..');

describe('Drip', function(){
  var settings;
  var payload;
  var drip;

  beforeEach(function(){
    drip = new Drip;
    payload = {};
    settings = {
      accountId: 8838307,
      campaignId: 2735752,
      token: 'bmrdc6hczyn8yss8o8ta'
    };
  });

  it('should have the correct settings', function(){
    test(drip)
      .name('Drip')
      .endpoint('https://api.getdrip.com/v1')
      .retries(2);
  });

  describe('.enabled()', function(){
    it('should be enabled for server side messages', function(){
      test(drip).enabled({
        channel: 'server',
        properties: { email: 'a@a.com' }
      });
    });

    it('should be disabled on other channels', function(){
      test(drip).disabled({
        channel: 'client',
        properties: { email: 'a@a.com' }
      });
    });

    it('should be disabled for messages without email', function(){
      test(drip).disabled({
        channel: 'server'
      });
    });
  });

  describe('.validate()', function(){
    it('should be valid when token + accountId are given', function(){
      test(drip).valid({}, settings);
    });

    it('should be invalid when token / accountId are missing', function(){
      test(drip).invalid({}, { accountId: 123 });
      test(drip).invalid({}, { token: 123 });
    });

    it('should be invalid when the msg is identify and campaignId is missing', function(){
      delete settings.campaignId;
      test(drip).invalid({ type: 'identify' }, settings);
    });
  });

  describe('mapper', function(){
    beforeEach(function(){
      drip.mapper = mapper;
    });

    describe('identify', function(){
      it('should map basic message', function(){
        test(drip, __dirname).fixture('identify-basic');
      });
    });

    describe('track', function(){
      it('should map basic message', function(){
        test(drip, __dirname).fixture('track-basic');
      });
    });
  });

  describe('.identify()', function(){
    it('should identify user successfully', function(done){
      var msg = helpers.identify({ traits: { email: 'amir@segment.io' } });

      payload.email = msg.email();
      payload.utc_offset = 0;
      payload.double_optin = false;
      payload.starting_email_index = 0;
      payload.custom_fields = drip.normalize(msg.traits());
      payload.reactivate_if_unsubscribed = false;

      test(drip)
        .set(settings)
        .identify(msg)
        .sends({ subscribers: [payload] })
        .end(done);
    });

    it('should identify again', function(done){
      var msg = helpers.identify({ traits: { email: 'amir@segment.io' } });;
      drip.identify(msg, settings, done);
    });

    it('should error with BadRequest on wrong creds', function(done){
      test(drip)
        .set({ accountId: 1, token: 'x' })
        .identify(helpers.identify())
        .error(done);
    });
  });

  describe('.campaignId()', function(){
    it('should return campaignId from the message', function(){
      var msg = helpers.track({ options: { Drip: { campaignId: '123' } }});
      assert('123' == drip.campaignId(msg, {}));
    })
  })

  describe('.track()', function(){
    it('should track successfully', function(done){
      var msg = helpers.track({ properties: { email: 'amir@segment.io' }, options: { Drip: { campaignId: '2735752' } }});
      drip.track(msg, settings, done);
    })
  })
})
