
var test         = require('segmentio-integration-tester');
var auth         = require('./auth');
var facade       = require('segmentio-facade');
var helpers      = require('./helpers');
var integrations = require('..');
var should       = require('should');

var iron = new integrations['Iron.io']()
  , settings = auth['Iron.io'];

describe('Iron IO', function () {

  describe('.enabled()', function () {
    var Track = facade.Track;
    it('should be enabled for server and client-side messages', function () {
      iron.enabled(new Track({ channel : 'server' })).should.be.ok;
      iron.enabled(new Track({ channel : 'client' })).should.be.ok;
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
      test(iron)
        .set(settings)
        .track(track)
        .sends(message(track))
        .expects(200, done);
    });
  });

  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      test(iron)
        .set(settings)
        .identify(identify)
        .sends(message(identify))
        .expects(200, done);
    });
  });

  function message(msg){
    return {
      messages: [
        { body: JSON.stringify(msg.json()) }
      ]
    };
  }
});
