
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var assert = require('assert');
var should = require('should');
var CustomerIO = require('..');

describe('Customer.io', function () {
  var settings;
  var cio;

  beforeEach(function(){
    cio = new CustomerIO;
    settings = {
      siteId: '83d520c82f8ddc4a67c8',
      apiKey: '1da93169bcc219b6f583'
    };
  });

  describe('.enabled()', function () {
    it('should only be enabled for server side messages', function () {
      cio.enabled(new facade.Track({
        channel: 'server',
        userId: 'userId'
      })).should.be.ok;
      cio.enabled(new facade.Alias({ channel : 'client' })).should.not.be.ok;
      cio.enabled(new facade.Alias({})).should.not.be.ok;
    });

    it('should only be enabled for messages with `userId`', function () {
      cio.enabled(new facade.Track({
        sessionId: 'session',
        channel: 'server'
      })).should.not.be.ok;

      cio.enabled(new facade.Track({
        userId: 'userId',
        channel: 'server'
      })).should.be.ok;
    });
  });


  describe('.validate()', function () {
    it('should require an apiKey', function () {
      cio.validate({}, { siteId : 'xxx' }).should.be.an.instanceOf(Error);
      cio.validate({}, { siteId : 'xxx', apiKey : '' }).should.be.an.instanceOf(Error);
    });

    it('should require a siteId', function () {
      cio.validate({}, { apiKey : 'xxx' }).should.be.an.instanceOf(Error);
      cio.validate({}, { siteId : '', apiKey : 'xxx' }).should.be.an.instanceOf(Error);
    });

    it('should validate with the required settings', function () {
      should.not.exist(cio.validate({}, { siteId : 'xxx', apiKey : 'xxx' }));
    });
  });


  describe('.track()', function () {
    it('should get a good response from the API', function (done) {
      var track = helpers.track();
      cio.track(track, settings, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var track = helpers.track();
      cio.track(track, { apiKey : 'x', siteId : 'x' }, function (err) {
        should.exist(err);
        err.status.should.eql(401);
        done();
      });
    });
  });

  describe('.identify()', function () {
    it('should get a good response from the API', function (done) {
      var identify = helpers.identify();
      cio.identify(identify, settings, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var identify = helpers.identify();
      cio.identify(identify, { apiKey : 'x', siteId : 'x' }, function (err) {
        should.exist(err);
        err.status.should.eql(401);
        done();
      });
    });

    it('should identify with only an email as id', function(done){
      var identify = new facade.Identify({ userId: 'amir@segment.io' });
      cio.identify(identify, settings, done);
    })
  });


  describe('.group()', function(){
    it('should get a good response from the API', function(done){
      var group = helpers.group();
      cio.group(group, settings, done);
    })
  })

  describe('.visit()', function(){
    it('should not send the request if active is false', function(done){
      var track = helpers.track();
      track.obj.options.active = false;
      cio.visit(track, settings, function(){
        arguments.length.should.eql(0);
        done();
      });
    })

    it('should send the request if active is true', function(done){
      var track = helpers.track(); // true by default.
      cio.visit(track, settings, done);
    })
  })


  describe('.alias()', function () {
    it('should do nothing', function (done) {
      cio.alias({}, {}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});
