
var facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should')
  , settings     = require('./auth.json')['CommandIQ']
  , ciq          = new integrations['CommandIQ']();


describe('CommandIQ', function () {

  describe('.enabled()', function () {
    it('should only be enabled for all messages', function () {
      ciq.enabled(new facade.Alias({ channel : 'server' })).should.be.ok;
      ciq.enabled(new facade.Alias({ channel : 'client' })).should.be.ok;
      ciq.enabled(new facade.Alias({})).should.be.ok;
    });
  });


  describe('.validate()', function () {

    it('should require an apiKey', function () {
      ciq.validate({}, {}).should.be.an.instanceOf(Error);
      ciq.validate({}, {apiKey : '' }).should.be.an.instanceOf(Error);
    });

    it('should validate with the required settings', function () {
      should.not.exist(ciq.validate({}, { apiKey : 'xxx' }));
    });
  });



  describe('.track()', function () {

    it('should get a good response from the API', function (done) {
      var track = helpers.track();
      ciq.track(track, settings, done);
    });

  });

  describe('.identify()', function () {

    it('should get a good response from the API', function (done) {
      var identify = helpers.identify();
      ciq.identify(identify, settings, done);
    });

  });


  describe('.alias()', function () {

    it('should do nothing', function (done) {
      ciq.alias({}, {}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});