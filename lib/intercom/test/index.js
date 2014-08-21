
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var hash = require('string-hash');
var mapper = require('../mapper');
var time = require('unix-time');
var should = require('should');
var assert = require('assert');
var Intercom = require('..');

describe('Intercom', function(){
  var intercom;
  var settings;
  var payload;
  var test;

  beforeEach(function(){
    payload = {};
    settings = {
      appId: '3iefb480',
      apiKey: '4ad6ce80fc1d441324cfb11cdf8d3ade8fc7e8fd'
    };
    intercom = new Intercom(settings);
    test = Test(intercom, __dirname);
    test.mapper(mapper);
  });

  it('should have correct settings', function(){
    test
      .name('Intercom')
      .endpoint('https://api-segment.intercom.io')
      .ensure('settings.apiKey')
      .ensure('settings.appId')
      .ensure('message.userId')
      .channels(['server'])
      .retries(2);
  });

  describe('.validate()', function(){
    var msg;

    beforeEach(function(){
      msg = { userId: 'user-id' };
    });

    it('should be invalid if .appId is missing', function(){
      delete settings.appId;
      test.invalid(msg, settings);
    });

    it('should be invalid if .apiKey is missing', function(){
      delete settings.apiKey;
      test.invalid(msg, settings);
    });

    it('should be invalid if .userId is missing', function(){
      delete msg.userId;
      test.invalid(msg, settings);
    });

    it('should be valid when .apiKey and .appId are given', function(){
      test.valid(msg, settings);
    });
  });

  describe('mapper', function(){
    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic');
      });

      it('should map basic context', function(){
        test.maps('identify-context');
      });

      it('should respect .active()', function(){
        test.maps('identify-active');
      });
    });

    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic');
      });
    });
  });

  describe('.identify()', function(){
    it('should be able to identify correctly', function(done){
      var msg = helpers.identify();

      payload.user_id = msg.userId();
      payload.remote_created_at = time(msg.created());
      payload.last_request_at = time(msg.timestamp());
      payload.last_seen_ip = msg.ip();
      payload.email = msg.email();
      payload.name = msg.name();
      payload.custom_attributes = intercom.formatTraits(msg.traits());
      payload.companies = [{
        company_id: hash('Segment.io'),
        custom_attributes: { name: 'Segment.io' },
        name: 'Segment.io'
      }];

      test
        .set(settings)
        .identify(msg)
        .sends(payload)
        .expects(200)
        .end(done);
    });

    it('should not error on invalid companies', function(done){
      var identify = helpers.identify({ traits: { companies: 'foo' }});
      intercom.identify(identify, function(err){
        should.not.exist(err);
        done();
      });
    });

    it('should send the ip address', function(done){
      var timestamp = new Date();
      test
        .set(settings)
        .identify({
          context: { ip: '70.211.71.236' },
          timestamp: timestamp,
          userId: 'userId'
        })
        .sends({
          custom_attributes: { id: 'userId' },
          last_request_at: time(timestamp),
          last_seen_ip: '70.211.71.236',
          user_id: 'userId',
        })
        .expects(200, done);
    });
  });

  describe('.group()', function(){
    it('should be able to group correctly', function(done){
      var msg = helpers.group();

      payload.user_id = msg.userId();
      payload.last_seen_ip = msg.ip();
      payload.last_request_at = time(msg.timestamp());

      payload.companies = [{
        company_id: msg.groupId(),
        custom_attributes: msg.traits(),
        name: msg.proxy('traits.name'),
        remote_created_at: time(msg.created())
      }];

      payload.custom_attributes = {
        companies: [payload.companies[0].custom_attributes],
        id: msg.userId()
      };

      test
        .set(settings)
        .group(msg)
        .sends(payload)
        .expects(200)
        .end(done);
    })

    it('should work with .createdAt', function(done){
      var traits = { createdAt: 'Jan 1, 2000 3:32:33 PM', name: 'old company' };
      var group = helpers.group({ traits: traits, groupId: 'a5322d6' });
      delete group.obj.traits.created;
      intercom.group(group, done);
    })

    it('should work with .created', function(done){
      var traits = { created: 'Jan 1, 2014 3:32:33 PM', name: 'new company' };
      var group = helpers.group({ traits: traits, groupId: 'e186e5de' });
      intercom.group(group, done);
    })
  })

  describe('.track()', function(){
    it('should track', function(done){
      var msg = helpers.track();

      payload.created = time(msg.timestamp());
      payload.event_name = msg.event();
      payload.user_id = msg.userId();
      payload.email = msg.email();
      payload.metadata = msg.properties();

      test
        .set(settings)
        .track(msg)
        .sends(payload)
        .expects(202)
        .end(done);
    });
  });
});
