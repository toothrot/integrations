var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var outbound = new integrations['Outbound']()
  , settings = auth['Outbound'];


describe('Outbound', function () {

  describe('.enabled()', function () {

    it('should only be enabled for server side messages', function () {
      outbound.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      outbound.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
      outbound.enabled(new facade.Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {

    it('should require an api key', function () {
      outbound.validate({}, { apiKey : '' }).should.be.an.instanceOf(Error);
      outbound.validate({}, {}).should.be.an.instanceOf(Error);
      should.not.exist(outbound.validate({}, { apiKey : 'xxx' }));
    });
  });


  describe('.track()', function () {

    it('should track successfully', function (done) {
      var track = helpers.track();
      outbound.track(track, settings, done);
    });
  });

  describe('.identify()', function () {

    it('should track successfully', function (done) {
      var identify = helpers.identify();
      outbound.identify(identify, settings, done);
    });
  });


  describe('.alias()', function () {
    it('should do nothing', function (done) {
      var alias = helpers.alias();
      outbound.alias(alias, settings, done);
    });
  });




});