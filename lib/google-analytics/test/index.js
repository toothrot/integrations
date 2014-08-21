
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var GoogleAnalytics = require('..');
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
      test = Test(ga.universal);
      settings = universal;
    });

    it('should have the correct settings', function(){
      test
        .name('Google Analytics')
        .endpoint('https://ssl.google-analytics.com/collect')
        .retries(2);
    });

    describe('.track()', function(){
      it('should get a good response from the API', function(done){
        var track = helpers.track();
        payload = ga.universal._common(track, settings);
        payload.ec = 'All';
        payload.el = 'event';
        payload.ev = 20;
        payload.ea = track.event();
        payload.t = 'event';

        test
          .set(settings)
          .track(track)
          .sends(payload)
          .expects(200, done);
      });

      it('should respect .label, .category and .value', function(done){
        var props = {};
        props.label = 'my-label';
        props.category = 'my-category';
        props.value = 9.99;
        var track = helpers.track({ properties: props });

        payload = ga.universal._common(track, settings);
        payload.ec = 'my-category';
        payload.el = 'my-label';
        payload.ev = 10;
        payload.ea = track.event();
        payload.t = 'event';

        test
          .set(settings)
          .track(track)
          .sends(payload)
          .expects(200, done);
      });

      it('should fallback to .revenue after .value', function(done){
        var track = {};
        track.userId = 'userId';
        track.event = 'event';
        track.properties = { revenue: 3.99 };

        var payload = {};
        payload.cid = 1162154969;
        payload.ea = 'event',
        payload.ec = 'All';
        payload.el = 'event';
        payload.ev = 4;
        payload.t = 'event';
        payload.tid = 'UA-27033709-11';
        payload.v = 1;

        test
          .set(settings)
          .track(track)
          .sends(payload)
          .expects(200, done);
      });
    });

    describe('.page()', function(){
      it('should get a good response from the API', function(done){
        var page = helpers.page();
        test
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
      });
    });

    describe('.identify()', function(){
      it('should do nothing', function(done){
        ga.identify({}, settings, done);
      });
    });


    describe('.alias()', function(){
      it('should do nothing', function(done){
        ga.alias({}, settings, done);
      });
    });

    describe('ecommerce', function(){
      it('should send ecommerce data', function(done){
        var track = helpers.transaction();
        ga.track(track, settings, done);
      });
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
