var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');

var usercycle = new integrations['USERcycle']()
  , settings = auth['USERcycle'];

describe('USERcycle', function () {

  describe('.enabled()', function () {
    it('should only be enabled for server side messages', function () {
      usercycle.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      usercycle.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
      usercycle.enabled(new facade.Track({})).should.not.be.ok;
    });
  });

  describe('.validate()', function () {
    it('should not validate settings without an apiKey', function () {
      var identify = helpers.identify();
      usercycle.validate(identify, {}).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      var identify = helpers.identify();
      should.not.exist(usercycle.validate(identify, { apiKey : 'x' }));
    });
  });

  describe('.track()', function () {
    var track = helpers.track();
    it('should be able to track correctly', function (done) {
      usercycle.track(track, settings, done);
    });
  });

  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      usercycle.identify(identify, settings, done);
    });
  });
});