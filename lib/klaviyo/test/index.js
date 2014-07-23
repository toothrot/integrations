var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var klaviyo = new integrations['Klaviyo']()
  , settings = auth['Klaviyo'];


describe('Klaviyo', function () {

  describe('.enabled()', function () {
    var Track = facade.Track;
    it('should only be enabled for server side messages', function () {
      klaviyo.enabled(new Track({ channel : 'server' })).should.be.ok;
      klaviyo.enabled(new Track({ channel : 'client' })).should.not.be.ok;
      klaviyo.enabled(new Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {
    it('should not validate settings without an apiKey', function () {
      var identify = helpers.identify();
      klaviyo.validate(identify, {}).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      var identify = helpers.identify();
      should.not.exist(klaviyo.validate(identify, { apiKey : 'x' }));
    });
  });


  describe('.track()', function () {
    var track = helpers.track();
    it('should be able to track correctly', function (done) {
      klaviyo.track(track, settings, done);
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      klaviyo.identify(identify, settings, done);
    });
  });

  describe('.alias()', function () {
    var alias = helpers.alias();
    it('should do nothing', function (done) {
      klaviyo.alias(alias, settings, done);
    });
  });
});