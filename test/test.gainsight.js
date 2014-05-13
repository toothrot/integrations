var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var gainsight = new integrations['Gainsight']()
  , settings = auth['Gainsight'];


describe('gainsight', function () {

  describe('.enabled()', function () {
    var Track = facade.Track;
    it('should only be enabled for server side messages', function () {
      gainsight.enabled(new Track({ channel : 'server' })).should.be.ok;
      gainsight.enabled(new Track({ channel : 'client' })).should.not.be.ok;
      gainsight.enabled(new Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {
    it('should not validate settings without a accessKey', function () {
      var identify = helpers.identify();
      gainsight.validate(identify, { }).should.be.instanceOf(Error);
    });

    it('should validate proper track', function () {
      var track = helpers.track();
      should.not.exist(gainsight.validate(track, settings));
    });
  });


  describe('.track()', function () {
    var track = helpers.track();
    it('should track correctly', function (done) {
      gainsight.track(track, settings, done);
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      gainsight.identify(identify, settings, done);
    });
  });


  describe('.alias()', function () {
    var alias = helpers.alias();
    it('success', function (done) {
      gainsight.alias(alias, settings, done);
    });
  });


  describe('.group()', function () {
    var alias = helpers.alias();
    it('success', function (done) {
      gainsight.alias(alias, settings, done);
    });
  });


  describe('.page()', function () {
    var alias = helpers.alias();
    it('success', function (done) {
      gainsight.alias(alias, settings, done);
    });
  });


  describe('.screen()', function () {
    var alias = helpers.alias();
    it('success', function (done) {
      gainsight.alias(alias, settings, done);
    });
  });

});
