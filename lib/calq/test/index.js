
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var mapper = require('../mapper');
var should = require('should');
var assert = require('assert');
var Calq = require('..');

describe('Calq', function () {
  var settings;
  var calq;

  beforeEach(function(){
    calq = new Calq;
    settings = { writeKey: '0e116d3930b329831f146716c3667dfe' };
  });

  describe('.enabled()', function () {
    it('should only be enabled for all messages', function () {
      calq.enabled(new facade.Track({ channel: 'server' })).should.be.ok;
      calq.enabled(new facade.Track({ channel: 'client' })).should.be.ok;
      calq.enabled(new facade.Track({ channel: 'mobile' })).should.be.ok;
      calq.enabled(new facade.Track({})).should.not.be.ok;
    });
  });

  describe('.validate()', function () {
    it('should require a write key', function () {
      calq.validate({}, {}).should.be.an.instanceOf(Error);
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map correctly', function(){
        var a = new facade.Track(require('./fixtures/track'));
        var b = mapper.track(a, { writeKey: 'key' });
        b.should.eql(require('./fixtures/track.out'));
      });
    });

    describe('alias', function(){
      it('should map correctly', function(){
        var a = new facade.Alias(require('./fixtures/alias'));
        var b = mapper.alias(a, { writeKey: 'key' });
        b.should.eql(require('./fixtures/alias.out'));
      });
    });

    describe('identify', function(){
      it('should map correctly', function(){
        var a = new facade.Identify(require('./fixtures/identify'));
        var b = mapper.identify(a, { writeKey: 'key' });
        b.should.eql(require('./fixtures/identify.out'));
      });
    });
  });

  describe('.track()', function () {
    it('should be able to track correctly', function (done) {
      calq.track(helpers.track(), settings, done);
    });

    it('should be able to track a bare call correctly', function (done) {
      calq.track(helpers.track.bare(), settings, done);
    });

    it('should error on an invalid write key', function (done) {
      calq.track(helpers.track(), { writeKey: 'bad_key' }, function (err) {
        should.exist(err);
        err.status.should.eql(400);
        done();
      });
    });
  });

  describe('.identify()', function () {
    it('should be able to identify correctly', function (done) {
      calq.identify(helpers.identify(), settings, done);
    });
  });

  describe('.alias()', function () {
    it('should be able to alias properly', function (done) {
      calq.alias(helpers.alias(), settings, done);
    });
  });
});
