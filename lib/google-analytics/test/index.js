
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var GoogleAnalytics = require('..');
var hash = require('string-hash');
var should = require('should');
var assert = require('assert');

describe('Google Analytics', function () {
  var settings;
  var universal;
  var classic;
  var ga;

  beforeEach(function(){
    ga = new GoogleAnalytics;
    universal = { serversideTrackingId: 'UA-27033709-11', serversideClassic: false };
    classic = { serversideTrackingId: 'UA-27033709-5', serversideClassic: true };
    settings = {
      universal: universal,
      classic: classic
    };
  });

  describe('universal', function () {
    beforeEach(function(){
      settings = universal;
    });

    describe('.enabled()', function () {
      it('should only be enabled for server side messages', function () {
        ga.enabled(new facade.Track({ channel : 'server' }), settings).should.be.ok;
        ga.enabled(new facade.Track({ channel : 'client' }), settings).should.not.be.ok;
        ga.enabled(new facade.Track({}), {}).should.not.be.ok;
      });

      it('should only be enabled for settings with .serversideTrackingId', function(){
        ga.enabled(new facade.Track({ channel : 'server' }), settings).should.be.ok;
        ga.enabled(new facade.Track({ channel : 'server' }), {}).should.not.be.ok;
      })
    });

    describe('.validate()', function () {
      it('should require a serversideTrackingId', function () {
        ga.validate({}, { serversideTrackingId : '' }).should.be.an.instanceOf(Error);
        ga.validate({}, {}).should.be.an.instanceOf(Error);
        should.not.exist(ga.validate({}, { serversideTrackingId : 'UA-123' }));
      });
    });


    describe('.track()', function () {
      it('should get a good response from the API', function (done) {
        var track = helpers.track();
        ga.track(track, settings, done);
      });
    });

    describe('.page()', function(){
      it('should get a good response from the API', function(done){
        var page = helpers.page();
        test(ga.universal)
          .set(settings)
          .page(page)
          .sends({
            tid: settings.serversideTrackingId,
            cid: hash(page.userId()),
            uip: page.ip(),
            dh: 'segment.io',
            t: 'pageview',
            dp: '/docs',
            dt: 'Support Docs',
            v: 1
          })
          .expects(200, done);
      })
    })

    describe('.identify()', function () {
      it('should do nothing', function (done) {
        ga.identify({}, settings, function (err) {
          should.not.exist(err);
          done();
        });
      });
    });


    describe('.alias()', function () {
      it('should do nothing', function (done) {
        ga.alias({}, settings, function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    describe('ecommerce', function(){
      it('should send ecommerce data', function(done){
        var track = helpers.transaction();
        ga.track(track, settings, done);
      });
    });
  });


  describe('classic', function () {
    beforeEach(function(){
      settings = classic;
    });

    describe('.enabled()', function () {
      it('should only be enabled for server side messages', function () {
        ga.enabled(new facade.Track({ channel : 'server' }), settings).should.be.ok;
        ga.enabled(new facade.Track({ channel : 'client' }), settings).should.not.be.ok;
        ga.enabled(new facade.Track({}), {}).should.not.be.ok;
      });

      it('should only be enabled for settings with .serversideTrackingId', function(){
        ga.enabled(new facade.Track({ channel : 'server' }), settings).should.be.ok;
        ga.enabled(new facade.Track({ channel : 'server' }), {}).should.not.be.ok;
      })
    });

    describe('.validate()', function () {
      it('should require a serversideTrackingId', function () {
        ga.validate({}, { serversideTrackingId : '' }).should.be.an.instanceOf(Error);
        ga.validate({}, {}).should.be.an.instanceOf(Error);
        should.not.exist(ga.validate({}, { serversideTrackingId : 'UA-123' }));
      });
    });


    describe('.track()', function () {
      it('should get a good response from the API', function (done) {
        var track = helpers.track();
        ga.track(track, settings, done);
      });
    });


    describe('.identify()', function () {
      it('should do nothing', function (done) {
        ga.identify({}, settings, function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    describe('.page()', function(){
      it('should get a good response from the API', function(done){
        var page = helpers.page();
        ga.page(page, settings, done);
      })
    })

    describe('.alias()', function () {
      it('should do nothing', function (done) {
        ga.alias({}, settings, function (err) {
          should.not.exist(err);
          done();
        });
      });
    });
  });


  describe('main', function () {
    describe('._pageview()', function () {
      it('should pageview with classic settings', function (done) {
        ga._pageview(helpers.track(), classic, done);
      });

      it('should pageview with universal settings', function (done) {
        ga._pageview(helpers.track(), universal, done);
      });
    });
  });
});
