
var express      = require('express')
  , facade       = require('segmentio-facade')
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
      cio.enabled(new facade.Track({
        channel: 'server',
        userId: 'userId'
      })).should.be.ok;
      cio.enabled(new facade.Alias({ channel : 'client' })).should.not.be.ok;
      cio.enabled(new facade.Alias({})).should.not.be.ok;
    });

    it('should only be enabled for messages with `userId`', function () {
      cio.enabled(new facade.Track({
        sessionId: 'session',
        channel: 'server'
      })).should.not.be.ok;

      cio.enabled(new facade.Track({
        userId: 'userId',
        channel: 'server'
      })).should.be.ok;
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

    it('will error on an invalid set of keys', function (done) {
      var track = helpers.track();
      cio.track(track, { apiKey : 'x', siteId : 'x' }, function (err) {
        should.exist(err);
        err.status.should.eql(401);
        done();
      });
    });
  });

  describe('.identify()', function () {

    it('should get a good response from the API', function (done) {
      var identify = helpers.identify();
      cio.identify(identify, settings, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var identify = helpers.identify();
      cio.identify(identify, { apiKey : 'x', siteId : 'x' }, function (err) {
        should.exist(err);
        err.status.should.eql(401);
        done();
      });
    });
  });

  describe('._visit()', function(){
    it('should not send the request if active is false', function(done){
      var track = helpers.track();
      track.obj.options.active = false;
      cio._visit(track, settings, function(){
        arguments.length.should.eql(0);
        done();
      });
    })

    it('should send the request if active is true', function(done){
      var track = helpers.track(); // true by default.
      cio._visit(track, settings, done);
    })
  })


  describe('.alias()', function () {

    it('should do nothing', function (done) {
      cio.alias({}, {}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});
