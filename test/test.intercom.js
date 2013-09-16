var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var intercom = new integrations['Intercom']()
  , settings = auth['Intercom'];


describe('Intercom', function () {

  describe('.enabled()', function () {
    var Track = facade.Track;
    it('should only be enabled for server side messages', function () {
      intercom.enabled(new Track({
        userId: 'x',
        channel: 'server'
      })).should.be.ok;

      intercom.enabled(new Track({
        userId: 'x',
        channel: 'client'
      })).should.not.be.ok;

      intercom.enabled(new Track({
        userId: 'x'
      })).should.not.be.ok;
    });

    it('should require a userId', function () {
      intercom.enabled(new Track({
        channel : 'server'
      })).should.not.be.ok;

      intercom.enabled(new Track({
        userId: 'x',
        channel: 'server'
      })).should.be.ok;
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


  describe('.track()', function () {
    var track = helpers.track();
    it('should do nothing', function (done) {
      intercom.track(track, settings, done);
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();
    this.timeout(4000);
    it('should be able to identify correctly', function (done) {
      intercom.identify(identify, settings, function (err) {
        should.not.exist(err);
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