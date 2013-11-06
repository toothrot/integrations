
var express      = require('express')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should')
  , settings     = require('./auth.json')['Trak.io']
  , tio          = new integrations['Trak.io']();


var app = express().use(express.bodyParser())
  , server;


describe('Trak.io', function () {

  before(function (done) { server = app.listen(4000, done); });
  after(function(done) { server.close(done); });

  describe('.enabled()', function () {

    it('should only be enabled for server side messages', function () {
      tio.enabled(new facade.Alias({ channel : 'server' })).should.be.ok;
      tio.enabled(new facade.Alias({ channel : 'client' })).should.not.be.ok;
      tio.enabled(new facade.Alias({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {

    it('should require a token', function () {
      tio.validate({}, {}).should.be.an.instanceOf(Error);
      tio.validate({}, { token : ''}).should. be.an.instanceOf(Error);
    });

    it('should validate with the required settings', function () {
      should.not.exist(tio.validate({}, { token : 'xxx' }));
    });
  });


  describe('.track()', function () {

    it('should get a good response from the API', function (done) {
      var track = helpers.track();
      tio.track(track, settings, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var track = helpers.track();
      tio.track(track, { token : 'x' }, function (err) {
        should.exist(err);
        err.status.should.eql(401);
        done();
      });
    });
  });

  describe('.identify()', function () {

    it('should get a good response from the API', function (done) {
      var identify = helpers.identify();
      tio.identify(identify, settings, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var identify = helpers.identify();
      tio.identify(identify, { token : 'x' }, function (err) {
        should.exist(err);
        err.status.should.eql(401);
        done();
      });
    });
  });


  describe('.alias()', function () {
    it('should get a good response from the api', function (done) {
      var alias = helpers.alias();
      tio.alias(alias, settings, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var alias = helpers.alias();
      tio.alias(alias, { token : 'x' }, function (err) {
        should.exist(err);
        err.status.should.eql(401);
        done();
      });
    });
  });
});