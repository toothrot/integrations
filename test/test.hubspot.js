var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var hubspot  = new integrations['HubSpot']()
  , settings = auth['HubSpot'];


describe('HubSpot', function () {

  describe('.enabled()', function () {
    it('should only be enabled for server side messages', function () {
      hubspot.enabled(new facade.Track({
        channel : 'server',
        userId  : 'calvin@segment.io'
      })).should.be.ok;
      hubspot.enabled(new facade.Track({
        channel : 'client',
        userId  : 'calvin@segment.io'
      })).should.not.be.ok;

      hubspot.enabled(new facade.Track({ userId : 'calvin@segment.io'})).should.not.be.ok;
    });

    it('should not be enabled without an email', function () {
      hubspot.enabled(new facade.Track({ channel : 'server' })).should.not.be.ok;
      hubspot.enabled(new facade.Track({
        channel : 'server',
        userId  : 'calvin@segment.io'
      })).should.be.ok;
    });
  });


  describe('.validate()', function () {
    var identify = helpers.identify();

    it('should not validate settings without a portalId', function () {
      hubspot.validate(identify, {}).should.be.instanceOf(Error);
      hubspot.validate(identify, { apiKey : 'x' }).should.be.instanceOf(Error);
    });

    it('should not validate messages without an apiKey', function () {
      hubspot.validate(identify, { portalId : 'x' }).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      should.not.exist(hubspot.validate(identify, { apiKey : 'x', portalId : 'y' }));
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();

    it('should identify successfully', function (done) {
      hubspot.identify(identify, settings, done);
    });
  });


  describe('.track()', function () {
    var track = helpers.track();

    it('should track successfully', function () {

    });
  });


  describe('.alias()', function () {
  });
});