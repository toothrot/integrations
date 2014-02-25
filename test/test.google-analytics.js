var auth            = require('./auth.json')
  , facade          = require('segmentio-facade')
  , GoogleAnalytics = require('..')['Google Analytics']
  , ga              = new GoogleAnalytics()
  , helpers         = require('./helpers')
  , should          = require('should');


describe('Google Analytics', function () {

  describe('universal', function () {
    var settings = auth['Google Analytics'].universal;

    describe('.enabled()', function () {
      it('should only be enabled for server side messages', function () {
        ga.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
        ga.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
        ga.enabled(new facade.Track({})).should.not.be.ok;
      });
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
        ga.page(page, settings, done);
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
  });


  describe('classic', function () {
    var settings = auth['Google Analytics'].classic;

    describe('.enabled()', function () {
      it('should only be enabled for server side messages', function () {
        ga.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
        ga.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
        ga.enabled(new facade.Track({})).should.not.be.ok;
      });
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
        var settings = auth['Google Analytics'].classic;
        ga._pageview(helpers.track(), settings, done);
      });

      it('should pageview with universal settings', function (done) {
        var settings = auth['Google Analytics'].universal;
        ga._pageview(helpers.track(), settings, done);
      });
    });
  });
});
