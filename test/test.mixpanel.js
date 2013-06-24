var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var mixpanel = new integrations['Mixpanel']()
  , settings = auth['Mixpanel'];


describe('Mixpanel', function () {

  describe('.enabled()', function () {
    it('should only be enabled for server side messages', function () {
      mixpanel.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      mixpanel.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
      mixpanel.enabled(new facade.Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {
    it('should not validate settings without a token', function () {
      var identify = helpers.identify();
      mixpanel.validate(identify, {}).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      var identify = helpers.identify();
      should.not.exist(mixpanel.validate(identify, { token : 'x' }));
    });
  });


  describe('.track()', function () {
  });


  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      mixpanel.identify(identify, settings, done);
    });
  });

  describe('.alias()', function () {});
});