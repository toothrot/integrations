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

    it('success', function (done) {
      gainsight.track(track, settings, done);
    });

    it('should error with invalid access key', function (done) {
      gainsight.track(track, {"accessKey" : "1234"}, function(err) {
        should.exist(err);
        done();
      });
    });
  });

  describe('.identify()', function () {
    var identify = helpers.identify();

    it('success', function (done) {
      var identify = helpers.identify();
      gainsight.identify(identify, settings, done);
    });

    it('should error with invalid access key', function (done) {
      gainsight.identify(identify, {"accessKey" : "1234"}, function(err) {
        should.exist(err);
        done();
      });
    });
  });

  describe('.alias()', function () {
    var alias = helpers.alias();

    it('success', function (done) {
      gainsight.alias(alias, settings, done);
    });

    it('should error with invalid access key', function (done) {
      gainsight.alias(alias, {"accessKey" : "1234"}, function(err) {
        should.exist(err);
        done();
      });
    });
  });

  describe('.group()', function () {
    var group = helpers.group();

    it('success', function (done) {
      gainsight.group(group, settings, done);
    });

    it('should error with invalid access key', function (done) {
      gainsight.group(group, {"accessKey" : "1234"}, function(err) {
        should.exist(err);
        done();
      });
    });
  });

  describe('.page()', function () {
    var page = helpers.page();

    it('success', function (done) {
      gainsight.page(page, settings, done);
    });

    it('should error with invalid access key', function (done) {
      gainsight.page(page, {"accessKey" : "1234"}, function(err) {
        should.exist(err);
        done();
      });
    });
  });
});
