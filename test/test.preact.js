var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var preact     = new integrations['Preact']()
  , settings = auth['Preact'];


describe('Preact', function () {


  describe('.enabled()', function () {
    it('should only be enabled for server side messages', function () {
      preact.enabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'server'
      })).should.be.ok;

      preact.enabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'client'
      })).should.not.be.ok;

      preact.enabled(new facade.Track({
        userId: 'calvin@segment.io'
      })).should.not.be.ok;
    });

    it('should only be enabled for messages with an email', function () {
      preact.enabled(new facade.Track({
        userId: 'calvin@segment.io',
        channel: 'server'
      })).should.be.ok;

      preact.enabled(new facade.Track({
        channel: 'server'
      }));
    });
  });


  describe('.validate()', function () {
    it('should require an apiSecret', function () {
      preact.validate({}, { projectCode : 'xxx' }).should.be.an.instanceOf(Error);
      preact.validate({}, { projectCode : 'xxx', apiSecret : '' }).should.be.an.instanceOf(Error);
    });

    it('should require a siteId', function () {
      preact.validate({}, { apiSecret : 'xxx' }).should.be.an.instanceOf(Error);
      preact.validate({}, { projectCode : '', apiSecret : 'xxx' }).should.be.an.instanceOf(Error);
    });

    it('should validate with the required settings', function () {
      should.not.exist(preact.validate({}, { projectCode : 'xxx', apiSecret : 'xxx' }));
    });
  });


  describe('.track()', function () {
    it('should get a good response from the API', function (done) {
      var track = helpers.track();
      preact.track(track, settings, done);
    });
  });


  describe('.identify()', function () {
    it('should do nothing', function (done) {
      var identify = helpers.identify();
      preact.identify(identify, settings, done);
    });
  });

  describe('.alias()', function () {
    it('should do nothing', function (done) {
      var alias = helpers.alias();
      preact.alias(alias, settings, done);
    });
  });
});