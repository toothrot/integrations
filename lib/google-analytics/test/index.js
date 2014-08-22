
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var GoogleAnalytics = require('..');
var mapper = require('../mapper');
var hash = require('string-hash');
var should = require('should');
var assert = require('assert');

describe('Google Analytics', function(){
  var settings;
  var universal;
  var classic;
  var payload;
  var test;
  var ga;

  beforeEach(function(){
    ga = new GoogleAnalytics;
    test = Test(ga);
    payload = {};
    universal = { serversideTrackingId: 'UA-27033709-11', serversideClassic: false };
    classic = { serversideTrackingId: 'UA-27033709-5', serversideClassic: true };
    settings = {
      universal: universal,
      classic: classic
    };
  });

  it('should have the correct settings', function(){
    test.name('Google Analytics');
  });

  describe('.enabled()', function(){
    it('should be enabled for server side messages', function(){
      test.enabled({ channel: 'server' }, settings.universal);
      test.enabled({ channel: 'server' }, settings.classic);
    });

    it('should be disabled for other channels', function(){
      test.disabled({ channel: 'client' }, settings.universal);
      test.disabled({ channel: 'mobile' }, settings.classic);
    });

    it('should be disabled for settings without .serversideTrackingId', function(){
      delete settings.universal.serversideTrackingId;
      test.disabled({ channel: 'server' }, settings.universal);
    });
  });

  describe('.validate()', function(){
    it('should be valid with .serversideTrackingId', function(){
      test.valid({}, settings.universal);
    });

    it('should be invalid without .serversideTrackingId', function(){
      delete settings.universal.serversideTrackingId;
      test.invalid({}, settings.universal);
    });
  });

  describe('universal', function(){
    beforeEach(function(){
      test = Test(ga.universal, __dirname);
      settings = universal;
      test.mapper(mapper);
    });

    it('should have the correct settings', function(){
      test
        .name('Google Analytics')
        .endpoint('https://ssl.google-analytics.com/collect')
        .retries(2);
    });

    describe('mapper', function(){
      describe('page', function(){
        it('should map basic page', function(){
          test.maps('page-basic', settings);
        });

        it('should map context.app', function(){
          test.maps('page-app', settings);
        });

        it('should map context.campaign', function(){
          test.maps('page-campaign', settings);
        });

        it('should map page with custom dimensions and metrics', function(){
          test.maps('page-cm-cd', settings);
        });
      });

      describe('track', function(){
        it('should map basic track', function(){
          test.maps('track-basic', settings);
        });

        it('should map context.app', function(){
          test.maps('track-app', settings);
        });

        it('should map page with custom dimensions and metrics', function(){
          test.maps('track-cm-cd', settings);
        });
      });

      describe('completed-order', function(){
        it('should map basic completed-order', function(){
          test.maps('completed-order-basic', settings);
        });

        it('should map context.app', function(){
          test.maps('completed-order-app', settings);
        });

        it('should map page with custom dimensions and metrics', function(){
          test.maps('completed-order-cm-cd', settings);
        });
      });
    });

    describe('.track()', function(){
      it('should get a good response from the API', function(done){
        var track = {};
        track.userId = 'userId';
        track.event = 'event';
        test
          .set(settings)
          .track(track)
          .expects(200, done);
      });

      it('should respect .label, .category and .value', function(done){
        var json = test.fixture('track-basic');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });

      it('should fallback to .revenue after .value', function(done){
        var json = test.fixture('track-revenue');
        test
          .set(settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });

      it('should send custom dimensions and metrics', function(done){
        var json = test.fixture('track-cm-cd');
        test
          .set(settings)
          .set(json.settings)
          .track(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('.page()', function(){
      it('should get a good response from the API', function(done){
        var json = test.fixture('page-basic');
        test
          .set(settings)
          .page(json.input)
          .sends(json.output)
          .expects(200, done);
      });

      it('should send custom dimensions and metrics', function(done){
        var json = test.fixture('page-cm-cd');
        test
          .set(settings)
          .set(json.settings)
          .page(json.input)
          .sends(json.output)
          .expects(200, done);
      });
    });

    describe('.completedOrder()', function(){
      it('should send ecommerce data', function(done){
        var track = helpers.transaction();
        ga.track(track, settings, done);
      });

      // TODO: cm, cd tests once we have multi request tests.
    });
  });


  describe('classic', function(){
    beforeEach(function(){
      test = Test(ga.classic);
      settings = classic;
    });

    it('should have the correct settings', function(){
      test
        .name('Google Analytics')
        .endpoint('https://ssl.google-analytics.com/__utm.gif')
        .retries(2);
    });

    describe('.track()', function(){
      it('should get a good response from the API', function(done){
        var track = helpers.track();
        var query = ga.classic._querystring(track, settings);

        query.utmhn = '';
        query.utme = ga.classic.formatEvent(track);
        query.utmt = 'event';
        query.utmni = 1;

        test
          .set(settings)
          .track(track)
          .query(query)
          .expects(200)
          .end(done);
      });
    });

    describe('.identify()', function(){
      it('should do nothing', function(done){
        ga.identify({}, settings, done);
      });
    });

    describe('.page()', function(){
      it('should get a good response from the API', function(done){
        var page = helpers.page();
        var query = ga.classic._querystring(page, settings);

        query.utmhn = '';
        query.utmdt = page.proxy('properties.title') || '';
        query.utmp = page.proxy('properties.path') || '/';

        test
          .set(settings)
          .page(page)
          .query(query)
          .expects(200)
          .end(done);
      });
    });

    describe('.alias()', function(){
      it('should do nothing', function(done){
        ga.alias({}, settings, function (err) {
          should.not.exist(err);
          done();
        });
      });
    });
  });


  describe('main', function(){
    describe('._pageview()', function(){
      it('should pageview with classic settings', function(done){
        ga._pageview(helpers.track(), classic, done);
      });

      it('should pageview with universal settings', function(done){
        ga._pageview(helpers.track(), universal, done);
      });
    });
  });
});
