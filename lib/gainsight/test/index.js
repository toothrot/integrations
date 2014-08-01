
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var should = require('should');
var assert = require('assert');
var Gainsight = require('..');
var Track = facade.Track;

describe('Gainsight', function () {
  var gainsight;
  var settings;

  beforeEach(function(){
    gainsight = new Gainsight;
    settings = { accessKey: '51c1ea6e-e5d2-4fe5-81e0-6df1e388ebe2' };
  });

  describe('.enabled()', function () {
    var Track = facade.Track;
    it('should only be enabled for all messages', function () {
      gainsight.enabled(new Track({ channel : 'server' })).should.be.ok;
      gainsight.enabled(new Track({ channel : 'client' })).should.be.ok;
      gainsight.enabled(new Track({})).should.not.be.ok;
    });
  });

  describe('.validate()', function () {
    it('should not validate settings without a accessKey', function () {
      var identify = helpers.identify();
      gainsight.validate(identify, {}).should.be.instanceOf(Error);
    });

    it('should validate proper track', function () {
      var track = helpers.track();
      should.not.exist(gainsight.validate(track, settings));
    });
  });

  describe.skip('.track()', function () {
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

  describe.skip('.identify()', function () {
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

  describe.skip('.alias()', function () {
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

  describe.skip('.group()', function () {
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

  describe.skip('.page()', function () {
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
