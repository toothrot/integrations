var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var librato  = new integrations['Librato']()
  , settings = auth['Librato'];


describe('Librato', function () {

  describe('.enabled()', function () {
    it('should be enabled for all messages', function () {
      librato.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      librato.enabled(new facade.Track({ channel : 'client' })).should.be.ok;
    });
  });


  describe('.validate()', function () {
    var identify = helpers.identify();

    it('should not validate settings without an email', function () {
      librato.validate(identify, {}).should.be.instanceOf(Error);
      librato.validate(identify, { token : 'x' }).should.be.instanceOf(Error);
    });

    it('should not validate messages without a token', function () {
      librato.validate(identify, { email : 'x' }).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      should.not.exist(librato.validate(identify, { email : 'x', token : 'y' }));
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();

    it('should do nothing', function (done) {
      librato.identify(identify, settings, done);
    });
  });


  describe('.track()', function () {
    var track = helpers.track();

    it('should track successfully', function (done) {
      librato.track(track, settings, done);
    });

    it('defaults to reporting a 1', function (done) {
      result = librato.mapper.track(track);
      result.value.should.equal(1);
      done();
    });

    it('allows reporting zeroes', function (done) {
      result = librato.mapper.track(helpers.track({'properties': {'value': 0}}));
      result.value.should.equal(0)
      done();
    });
  });


  describe('.alias()', function () {
    var alias = helpers.alias();

    it('should do nothing', function (done) {
      librato.alias(alias, settings, done);
    });
  });
});