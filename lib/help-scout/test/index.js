
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var assert = require('assert');
var should = require('should');
var Helpscout = require('..');

describe('Help Scout', function () {
  var helpscout;
  var payload;
  var settings;

  beforeEach(function(){
    helpscout = new Helpscout;
    settings = { apiKey: '084590ef61403fe1edd6aeb6c39ff594276b4f8b' };
    payload = {};
  });

  it('should correct settings', function(){
    test(helpscout)
      .name('Help Scout')
      .endpoint('https://api.helpscout.net/v1')
      .retries(2);
  });

  describe('.enabled()', function () {
    it('should be enabled for all messages', function () {
      test(helpscout).enabled({ channel: 'server' });
      test(helpscout).enabled({ channel: 'client' });
      test(helpscout).enabled();
    });
  });

  describe('.validate()', function () {
    it('should be invalid without apiKey', function(){
      test(helpscout).invalid(helpers.identify(), {});
    });

    it('should be invalid if email is missing', function(){
      test(helpscout).invalid({ type: 'identify' }, settings);
    });

    it('should be valid if email and apiKey is given', function(){
      test(helpscout).valid(helpers.identify(), settings);
    });
  });

  describe('.track()', function () {
    it('should do nothing on track', function (done) {
      helpscout.track(helpers.track(), settings, done);
    });
  });

  describe('.identify()', function () {
    it('should be able to identify a new user', function(done){
      var msg = helpers.identify();

      payload.emails = [{ value: msg.email() }];
      payload.firstName = msg.firstName();
      payload.lastName = msg.lastName();
      payload.organization = msg.proxy('traits.organization') || msg.proxy('traits.company');
      payload.websites = msg.proxy('traits.websites').map(function(w){ return { value: w } });
      payload.phones = [{ location: 'mobile', value: msg.proxy('traits.phone') }];

      test(helpscout)
        .set(settings)
        .identify(msg)
        .sends(payload)
        .expects(201, function(err, res){
          if (err) return done(err);
          res.body.item.emails[0].value.should.eql(msg.email());
          done();
        });
    });

    it('should be able to identify an existing user', function (done) {
      var msg = helpers.identify({ email: 'calvin@segment.io' });

      payload.emails = [{ value: msg.email() }];
      payload.firstName = msg.firstName();
      payload.lastName = msg.lastName();
      payload.organization = msg.proxy('traits.organization') || msg.proxy('traits.company');
      payload.websites = msg.proxy('traits.websites').map(function(w){ return { value: w } });
      payload.phones = [{ location: 'mobile', value: msg.proxy('traits.phone') }];

      test(helpscout)
        .set(settings)
        .identify(msg)
        .sends(payload)
        .expects(201, function(err, res){
          if (err) return done(err);
          res.body.item.emails[0].value.should.eql(msg.email());
          done();
        });
    });
  });


  describe('.alias()', function () {
    it('should do nothing on alias', function (done) {
      helpscout.alias(helpers.alias(), settings, done);
    });
  });


  describe('._getUser()', function () {
    it('should error on an invalid key', function (done) {
      var settings = { apiKey : 'segment' }
        , email    = 'calvin@segment.io';
      helpscout._getUser({ email : email }, settings, function (err, user) {
        should.exist(err);
        err.status.should.eql(401);
        should.not.exist(user);
        done();
      });
    });

    it('should not return a non-existent user', function (done) {
      var email = 'non-existent@segment.io';
      helpscout._getUser({ email : email }, settings, function (err, user) {
        should.not.exist(err);
        should.not.exist(user);
        done();
      });
    });

    it('should return an existing user', function (done) {
      var identify = helpers.identify({ email: 'calvin@segment.io' })
      var email = identify.email();
      helpscout._getUser({ email : email }, settings, function (err, user) {
        should.not.exist(err);
        should.exist(user);
        user.firstName.should.eql(identify.firstName());
        user.lastName.should.eql(identify.lastName());
        done();
      });
    });
  });
});
