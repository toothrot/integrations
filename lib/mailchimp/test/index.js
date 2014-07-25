
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var should = require('should');
var assert = require('assert');
var Mailchimp = require('..');

describe('MailChimp', function () {
  var mailchimp;
  var settings;

  beforeEach(function(){
    mailchimp = new Mailchimp;
    settings = {
      datacenter: 'us2',
      listId: '2875b61629',
      apiKey: '859e55635946cd5498f3e909b806e6ba-us2'
    };
  });

  describe('.enabled()', function () {

    it('should be enabled for all channels', function () {
      mailchimp.enabled(new facade.Identify({
        channel: 'server',
        userId: 'test@email.com'
      })).should.be.ok;
      mailchimp.enabled(new facade.Identify({
        channel: 'client',
        userId: 'test@email.com'
      })).should.be.ok;
    });

    it('should only be enabled for messages with `email`', function () {
      mailchimp.enabled(new facade.Identify({
        sessionId: 'session',
        channel: 'server'
      })).should.not.be.ok;

      mailchimp.enabled(new facade.Identify({
        userId: 'test@email.com',
        channel: 'server'
      })).should.be.ok;

      mailchimp.enabled(new facade.Identify({
        userId: 'userId',
        traits: {
          email : 'test@email.com'
        },
        channel: 'server'
      })).should.be.ok;
    });
  });


  describe('.validate()', function () {

    it('should require an apiKey', function () {
      mailchimp.validate({}, { listId : 'xxx', datacenter : 'us1' }).should.be.an.instanceOf(Error);
      mailchimp.validate({}, { listId : 'xxx', apiKey : '', datacenter : 'us1' }).should.be.an.instanceOf(Error);
    });

    it('should require a listId', function () {
      mailchimp.validate({}, { apiKey : 'xxx', datacenter: 'us1' }).should.be.an.instanceOf(Error);
      mailchimp.validate({}, { listId : '', apiKey : 'xxx', datacenter : 'us1' }).should.be.an.instanceOf(Error);
    });

    it('should require a datacenter', function () {
      mailchimp.validate({}, { listId : 'xxx', apiKey : 'xxx' }).should.be.an.instanceOf(Error);
      mailchimp.validate({}, { listId : 'xxx', apiKey : 'xxx', datacenter : '' }).should.be.an.instanceOf(Error);
    });

    it('should validate with the required settings and email address', function () {
      should.not.exist(mailchimp.validate({ userId : 'test@email.com' }, { listId : 'xxx', apiKey : 'xxx', datacenter : 'us1' }));
    });
  });


  describe('.identify()', function () {

    it('should get a good response from the API', function (done) {
      var identify = helpers.identify();
      mailchimp.identify(identify, settings, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var identify = helpers.identify();
      mailchimp.identify(identify, { apiKey : 'x', listId : 'x' }, function (err) {
        should.exist(err);
        done();
      });
    });
  });


  describe('.track()', function () {

    it('should do nothing', function (done) {
      var track = helpers.track();
      mailchimp.track(track, settings, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });


  describe('.alias()', function () {

    it('should do nothing', function (done) {
      mailchimp.alias({}, {}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});
