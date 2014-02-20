var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var keen = new integrations['Keen IO']()
  , settings = auth['Keen IO'];


describe('Keen IO', function () {

  describe('.enabled()', function () {
    var Track = facade.Track;
    it('should only be enabled for server side messages', function () {
      keen.enabled(new Track({ channel : 'server' })).should.be.ok;
      keen.enabled(new Track({ channel : 'client' })).should.not.be.ok;
      keen.enabled(new Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {
    it('should not validate settings without a projectId', function () {
      var identify = helpers.identify();
      keen.validate(identify, { writeKey : 'x' }).should.be.instanceOf(Error);
    });

    it('should not validate settings without a writeKey', function () {
      var identify = helpers.identify();
      keen.validate(identify, { projectId : 'x'}).should.be.instanceOf(Error);
    });

    it('should validate proper track', function () {
      var track = helpers.track();
      should.not.exist(keen.validate(track, settings));
    });
  });


  describe('.track()', function () {
    var track = helpers.track();
    it('should track correctly', function (done) {
      keen.track(track, settings, done);
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      keen.identify(identify, settings, done);
    });
  });


  describe('.alias()', function () {
    var alias = helpers.alias();
    it('should do nothing', function (done) {
      keen.alias(alias, settings, done);
    });
  });
});
