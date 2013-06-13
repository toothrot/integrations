
var express      = require('express')
  , integrations = require('..')
  , should       = require('should')
  , supertest    = require('supertest')
  , webhook      = new integrations.Webhooks();


var app = express()
            .use(express.bodyParser());


describe('Webhooks', function () {


  before(function (done) { app.listen(4000, done); });


  describe('.enabled()', function () {

    it('should always be enabled', function () {

      webhook.enabled({ channel : 'server' }).should.be.ok;
      webhook.enabled({ channel : 'client' }).should.be.ok;
      webhook.enabled().should.be.ok;
    });
  });


  describe('.validate()', function () {

    it('should require a valid globalHook', function () {
      var message = {};

      should.not.exist(webhook.validate(message, {
        globalHook : 'http://www.segment.io'
      }));

      should.exist(webhook.validate(message, {}));
      should.exist(webhook.validate(message, { globalHook : true }));
      should.exist(webhook.validate(message, { globalHook : '' }));
      should.exist(webhook.validate(message, { globalHook : 'aaaa' }));
    });
  });


  /**
   * Test that our api calls forward properly
   */
  ['track', 'identify', 'alias'].forEach(testApiCall);

});


/**
 * Test an api call to make sure that it gets passed along properly
 * @param  {String} call ['identify', 'track', or 'alias']
 */
function testApiCall (call) {

  var message  = { name: 'My message' };

  describe('.' + call + '()', function () {

    it('should succeed on an valid call', function (done) {

      var route = '/' + call + '/valid'
        , settings = { globalHook : 'http://localhost:4000' + route };

      app.post(route, function (req, res, next) {
        req.body.should.eql(message);
        res.send();
      });

      webhook[call](message, settings, function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should not succeed on an error', function (done) {
      var route    = '/' + call + '/error'
        , settings = { globalHook : 'http://localhost:4000' + route }
        , status   = 503;

      app.post(route, function (req, res, next) {
        req.body.should.eql(message);
        res.send(status);
      });

      webhook[call](message, settings, function (err) {
        should.exist(err);
        err.status.should.eql(status);
        done();
      });
    });
  });
}