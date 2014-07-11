var test = require('segmentio-integration-tester');
var settings = require('./auth').Intercom;
var facade = require('segmentio-facade');
var Intercom = require('..').Intercom;
var helpers = require('./helpers');
var time = require('unix-time');
var assert = require('assert');
var should = require('should');

/**
 * Create our integration
 */

var intercom = new Intercom;


describe('Intercom', function () {
  describe('.enabled()', function () {
    var Track = facade.Track;
    it('should only be enabled for server side messages', function () {
      assert(test(intercom).enabled({
        channel: 'server',
        userId: 'x'
      }));

      assert(test(intercom).disabled({
        channel: 'client',
        userId: 'x'
      }));

      assert(test(intercom).disabled({
        channel: 'mobile',
        userId: 'x'
      }));
    });

    it('should require a userId', function () {
      assert(test(intercom).disabled({
        channel: 'server'
      }));

      assert(test(intercom).enabled({
        channel: 'server',
        userId: 'x'
      }));
    });
  });


  describe('.validate()', function () {
    it('should not validate settings without a appId', function () {
      var identify = helpers.identify();
      intercom.validate(identify, { apiKey : 'x' }).should.be.instanceOf(Error);
    });

    it('should not validate settings without an apiKey', function () {
      var identify = helpers.identify();
      intercom.validate(identify, { appId : 'x'}).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      var identify = helpers.identify();
      should.not.exist(intercom.validate(identify, { appId : 'x', apiKey : 'x' }));
    });
  });

  describe('.identify()', function () {
    it('should be able to identify correctly', function (done) {
      var identify = helpers.identify();
      intercom.identify(identify, settings, function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should not error on invalid companies', function (done) {
      var identify = helpers.identify({ traits: { companies: 'foo' }});
      intercom.identify(identify, settings, function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should send the ip address', function(done){
      var timestamp = new Date();
      test(intercom)
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
      var group = helpers.group();
      intercom.group(group, settings, done);
    })

    it('should work with .createdAt', function(done){
      var traits = { createdAt: 'Jan 1, 2000 3:32:33 PM', name: 'old company' };
      var group = helpers.group({ traits: traits, groupId: 'a5322d6' });
      delete group.obj.traits.created;
      intercom.group(group, settings, done);
    })

    it('should work with .created', function(done){
      var traits = { created: 'Jan 1, 2014 3:32:33 PM', name: 'new company' };
      var group = helpers.group({ traits: traits, groupId: 'e186e5de' });
      intercom.group(group, settings, done);
    })
  })

  describe('.track()', function () {
    var track = helpers.track();
    it('should track', function (done) {
      intercom.track(track, settings, function(err){
        if (err) return done(err);
        done();
      });
    });
  });

  describe('.alias()', function () {
    var alias = helpers.alias();
    it('should do nothing', function (done) {
      intercom.alias(alias, settings, done);
    });
  });
});
