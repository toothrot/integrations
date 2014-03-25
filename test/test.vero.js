var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var vero     = new integrations['Vero']()
  , settings = auth['Vero'];


describe('Vero', function () {

  describe('.enabled()', function () {

    it('should only be enabled for server side messages', function () {
      vero.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      vero.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
      vero.enabled(new facade.Track({})).should.not.be.ok;
    })
  });


  describe('.validate()', function () {

    it('should require an authToken', function () {
      vero.validate({}, { authToken : '' }).should.be.an.instanceOf(Error);
      vero.validate({}, {}).should.be.an.instanceOf(Error);
      should.not.exist(vero.validate({}, { authToken : 'xxx' }));
    });
  });


  describe('.track()', function () {

    it('should get a good response from the API', function (done) {
      var track = helpers.track();
      vero.track(track, settings, done);
    });
  });

  describe('.identify()', function () {

    it('should get a good response from the API', function (done) {
      var identify = helpers.identify();
      vero.identify(identify, settings, done);
    });
  });


  describe('.alias()', function () {
    it('should alias correctly', function (done) {
      var alias = helpers.alias();
      vero.alias(alias, settings, done);
    });
  });
});
