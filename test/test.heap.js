var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var heap = new integrations['Heap']()
  , settings = auth['Heap'];


describe('Heap', function () {
  describe('.enabled()', function () {
    var Track = facade.Track;
    it('should only be enabled for server side messages', function () {
      heap.enabled(new Track({ channel : 'server' })).should.be.ok;
      heap.enabled(new Track({ channel : 'client' })).should.not.be.ok;
      heap.enabled(new Track({})).should.not.be.ok;
    });
  });

  describe('.validate()', function () {
    it('should not validate settings without an app_id', function () {
      var track = helpers.track();
      heap.validate(track, {}).should.be.instanceOf(Error);
    });

    it('should validate proper track', function () {
      var track = helpers.track(settings);
      should.not.exist(heap.validate(track, settings));
    });
  });

  describe('.track()', function () {
    it('should get a good response from the API', function (done) {
      var track = helpers.track({email: settings.email});
      heap.track(track, settings, done);
    });
  });
});
