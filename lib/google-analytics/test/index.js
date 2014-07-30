
var test = require('segmentio-integration-tester');
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
  var ga;

  beforeEach(function(){
    ga = new GoogleAnalytics;
    payload = {};
    universal = { serversideTrackingId: 'UA-27033709-11', serversideClassic: false };
    classic = { serversideTrackingId: 'UA-27033709-5', serversideClassic: true };
    settings = {
      universal: universal,
      classic: classic
    };
  });

  describe('universal', function(){
    beforeEach(function(){
      settings = universal;
    });

    it('should have the correct settings', function(){
      test(ga.universal)
        .name('Google Analytics')
        .endpoint('https://ssl.google-analytics.com/collect')
        .retries(2);
    });

    describe('.enabled()', function(){
      it('should be enabled for server side messages', function(){
        test(ga).enabled({ channel: 'server' }, settings);
      });

      it('should be disabled for other channels', function(){
        test(ga).disabled({ channel: 'client' }, settings);
        test(ga).disabled({ channel: 'mobile' }, settings);
      });

      it('should be disabled for settings without .serversideTrackingId', function(){
        delete settings.serversideTrackingId;
        test(ga).disabled({ channel: 'server' }, settings);
      });
    });

    describe('.validate()', function(){
      it('should be valid with .serversideTrackingId', function(){
        test(ga).valid({}, settings);
      });

      it('should be invalid without .serversideTrackingId', function(){
        test(ga).invalid({}, {});
      });
    });

    describe('.track()', function(){
      it('should get a good response from the API', function(done){
        var track = helpers.track();
        payload = ga.universal._common(track, settings);
        payload.ec = 'All';
        payload.el = 'event';
        payload.ev = 0;
        payload.ea = track.event();
        payload.t = 'event';

        test(ga.universal)
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

        test(ga.universal)
          .set(settings)
          .track(track)
          .sends(payload)
          .expects(200, done);
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
      settings = classic;
    });

    describe('.enabled()', function(){
      it('should be enabled for server side messages', function(){
        test(ga).enabled({ channel: 'server' }, settings);
      });

      it('should be disabled for other channels', function(){
        test(ga).disabled({ channel: 'client' }, settings);
      });

      it('should be enabled for settings with .serversideTrackingId', function(){
        test(ga).enabled({ channel: 'server' }, settings);
      });

      it('should be disabled for settings without .serversideTrackingId', function(){
        delete settings.serversideTrackingId;
        test(ga).disabled({ channel: 'server' }, settings);
      });
    });

    describe('.validate()', function(){
      it('should be invalid if .serversideTrackingId is missing', function(){
        delete settings.serversideTrackingId;
        test(ga).invalid({}, settings);
      });

      it('should be valid if .serversideTrackingId is given', function(){
        test(ga).valid({}, settings);
      });
    });

    describe('.track()', function(){
      it('should get a good response from the API', function(done){
        var track = helpers.track();
        var query = ga.classic._querystring(track, settings);

        query.utmhn = '';
        query.utme = ga.classic.formatEvent(track);
        query.utmt = 'event';
        query.utmni = 1;

        test(ga.classic)
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

        test(ga.classic)
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
