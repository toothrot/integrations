
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var assert = require('assert');
var should = require('should');
var KeenIO = require('..');

describe('Keen IO', function () {
  var settings;
  var keen;

  beforeEach(function(){
    keen = new KeenIO;
    settings = {
      projectId: '5181bcd23843312d87000000',
      writeKey: '6d5c9e2365324fa4a631e88cd4ce7df3ca4bf41e5a9a29e48c2dfb57408bb978f5d2e6d77424fa14c9d167c72d8e1d618c7eea178ecf5934dc8d456e0114ec81112f81e8df9507a31b7bfee9cbd00944f59d54f199f046263578ded79b62c33a435f17907bffae8fd8e109086eb53f1b'
    };
  });

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
