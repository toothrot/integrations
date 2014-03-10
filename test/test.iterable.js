var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var iterable     = new integrations['Iterable']()
  , settings     = auth['Iterable'];


describe('Iterable', function () {

  describe('.enabled()', function () {

    it('should only be enabled for server side messages', function () {
      iterable.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      iterable.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
      iterable.enabled(new facade.Track({})).should.not.be.ok;
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
