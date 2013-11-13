
var express = require('express');
var facade = require('segmentio-facade');
var helpers = require('./helpers');
var integrations = require('..');
var should = require('should');
var settings = require('./auth.json')['Customer.io'];
var cio = new integrations['Customer.io']();

var app = express().use(express.bodyParser());
var server;

describe('Customer.io', function () {

  before(function (done) {
    server = app.listen(4000, done);
  });

  after(function(done) {
    server.close(done);
  });

  describe('#enabled', function () {
    it('should only be enabled for server side messages', function () {
      cio.enabled(new facade.Alias({ channel: 'server' })).should.be.ok;
      cio.enabled(new facade.Alias({ channel: 'client' })).should.not.be.ok;
      cio.enabled(new facade.Alias({})).should.not.be.ok;
    });
  });

  describe('#validate', function () {
    it('should require an apiKey', function () {
      cio.validate({}, { siteId: 'xxx' }).should.be.an.instanceOf(Error);
      cio.validate({}, { siteId: 'xxx', apiKey : '' }).should.be.an.instanceOf(Error);
    });

    it('should require a siteId', function () {
      cio.validate({}, { apiKey: 'xxx' }).should.be.an.instanceOf(Error);
      cio.validate({}, { siteId: '', apiKey: 'xxx' }).should.be.an.instanceOf(Error);
    });

    it('should validate with the required settings', function () {
      should.not.exist(cio.validate({}, { siteId: 'xxx', apiKey: 'xxx' }));
    });
  });

  describe('#track', function () {
    it('should get a good response from the api', function (done) {
      var track = helpers.track();
      cio.track(track, settings, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var track = helpers.track();
      cio.track(track, { apiKey: 'x', siteId: 'x' }, function (err) {
        should.exist(err);
        err.status.should.eql(401);
        done();
      });
    });
  });

  describe('#identify', function () {
    it('should get a good response from the api', function (done) {
      var identify = helpers.identify();
      cio.identify(identify, settings, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var identify = helpers.identify();
      cio.identify(identify, { apiKey: 'x', siteId: 'x' }, function (err) {
        should.exist(err);
        err.status.should.eql(401);
        done();
      });
    });
  });

  describe('#alias', function () {
    it('should do nothing', function (done) {
      cio.alias({}, {}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});