var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var woopra   = new integrations['Woopra']()
  , settings = auth['Woopra'];


describe('Woopra', function () {

  describe('.enabled()', function () {

    it('should only be enabled for server side messages', function () {
      woopra.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      woopra.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
      woopra.enabled(new facade.Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {

    it('should require a domain', function () {
      woopra.validate({}, { domain : '' }).should.be.an.instanceOf(Error);
      woopra.validate({}, {}).should.be.an.instanceOf(Error);
      should.not.exist(woopra.validate({}, { domain : 'xxx' }));
    });
  });


  describe('.track()', function () {
    it('should track successfully', function (done) {
      var track = helpers.track();
      woopra.track(track, settings, done);
    });
  });

  describe('.identify()', function () {
    it('should identify successfully', function (done) {
      var identify = helpers.identify();
      woopra.identify(identify, settings, done);
    });
  });


  describe('.alias()', function () {
    it('should do nothing', function (done) {
      var alias = helpers.alias();
      woopra.alias(alias, settings, done);
    });
  });
});
