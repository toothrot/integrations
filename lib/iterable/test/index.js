
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var should = require('should');
var assert = require('assert');
var Iterable = require('..');

describe('Iterable', function () {
  var settings;
  var iterable;

  beforeEach(function(){
    iterable = new Iterable;
    settings = { apiKey: 'a1b0ad8c09cb419498ab90c2b005ed6a' };
  });

  describe('.enabled()', function () {
    it('should only be enabled for all messages with email', function () {
      iterable.enabled(new facade.Track({
        userId: 'test@segment.io',
        channel: 'client'
      })).should.be.ok;

      iterable.enabled(new facade.Track({
        userId: 'sss',
        channel: 'client'
      })).should.not.be.ok;
    });
  });

  describe('.validate()', function () {
    it('should require an apiKey', function () {
      iterable.validate({}, { apiKey : '' }).should.be.an.instanceOf(Error);
      iterable.validate({}, {}).should.be.an.instanceOf(Error);
      should.not.exist(iterable.validate({}, { apiKey : 'xxx' }));
    });
  });

  describe('.track()', function () {
    it('should get a good response from the API', function (done) {
      var track = helpers.track();
      iterable.track(track, settings, done);
    });
  });

  describe('.identify()', function () {
    it('should get a good response from the API', function (done) {
      var identify = helpers.identify();
      iterable.identify(identify, settings, done);
    });
  });

  describe('.alias()', function () {
    it('should do nothing', function (done) {
      var alias = helpers.alias();
      iterable.alias(alias, settings, done);
    });
  });
});
