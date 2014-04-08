var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should')

var iron = new integrations['Iron IO']()
  , settings = auth['Iron IO'];


describe('Iron IO', function () {

  describe('.enabled()', function () {
    var Track = facade.Track;
    it('should only be enabled for server side messages', function () {
      iron.enabled(new Track({ channel : 'server' })).should.be.ok;
      iron.enabled(new Track({ channel : 'client' })).should.not.be.ok;
      iron.enabled(new Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {
    it('should not validate settings without a projectId', function () {
      var identify = helpers.identify();
      iron.validate(identify, { token : 'x' }).should.be.instanceOf(Error);
    });

    it('should not validate settings without a writeKey', function () {
      var identify = helpers.identify();
      iron.validate(identify, { projectId : 'x'}).should.be.instanceOf(Error);
    });

    it('should validate proper track', function () {
      var track = helpers.track();
      should.not.exist(iron.validate(track, settings));
    });
  });


  describe('.track()', function () {
    var track = helpers.track();

    it('should track correctly', function (done) {
      iron.track(track, settings, done);
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      iron.identify(identify, settings, done);
    });
  });


  describe('.alias()', function () {
    var alias = helpers.alias();
    it('should do nothing', function (done) {
      iron.alias(alias, settings, done);
    });
  });
});
