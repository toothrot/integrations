
var express      = require('express')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should')
  , settings     = require('./auth.json')['Customer.io']
  , cio          = new integrations['Customer.io']();


var app = express().use(express.bodyParser())
  , server;


describe('Customer.io', function () {

  before(function (done) { server = app.listen(4000, done); });
  after(function(done) { server.close(done); });

  describe('.enabled()', function () {

    it('should only be enabled for server side messages', function () {
      cio.enabled({ channel : 'server' }).should.be.ok;
      cio.enabled({ channel : 'client' }).should.not.be.ok;
      cio.enabled({}).should.not.be.ok;
    });
  });


  describe('.validate()', function () {

    it('should require an apiKey', function () {
      cio.validate({}, { siteId : 'xxx' }).should.be.an.instanceOf(Error);
      cio.validate({}, { siteId : 'xxx', apiKey : '' }).should.be.an.instanceOf(Error);
    });

    it('should require a siteId', function () {
      cio.validate({}, { apiKey : 'xxx' }).should.be.an.instanceOf(Error);
      cio.validate({}, { siteId : '', apiKey : 'xxx' }).should.be.an.instanceOf(Error);
    });

    it('should validate with the required settings', function () {
      should.not.exist(cio.validate({}, { siteId : 'xxx', apiKey : 'xxx' }));
    });
  });


  describe('.track()', function () {

    it('should get a good response from the API', function (done) {
      var track = helpers.track();
      cio.track(track, settings, done);
    });
  });

  describe('.identify()', function () {

    it('should get a good response from the API', function (done) {
      var identify = helpers.identify();
      cio.identify(identify, settings, done);
    });
  });


  describe('.alias()', function () {

    it('should do nothing', function (done) {
      cio.alias({}, {}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});