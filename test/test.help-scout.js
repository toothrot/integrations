var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var helpscout = new integrations['Help Scout']()
  , settings  = auth['Help Scout'];


describe('Help Scout', function () {

  describe('.enabled()', function () {
    it('should only be enabled for all messages', function () {
      helpscout.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      helpscout.enabled(new facade.Track({ channel : 'client' })).should.be.ok;
      helpscout.enabled(new facade.Track({})).should.be.ok;
    });
  });


  describe('.validate()', function () {
    it('should not validate settings without an apiKey', function () {
      var identify = helpers.identify();
      helpscout.validate(identify, {}).should.be.instanceOf(Error);
    });

    it('should not validate messages without an email', function () {
      var identify = new facade.Identify({
        traits : {},
        userId : 'aaa'
      });
      helpscout.validate(identify, { apiKey : 'x' }).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      var identify = helpers.identify();
      should.not.exist(helpscout.validate(identify, { apiKey : 'x' }));
    });
  });


  describe('.track()', function () {
    it('should do nothing on track', function (done) {
      helpscout.track(helpers.track(), settings, done);
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify()
      , filter   = { email : identify.email() };

    it('should be able to identify a new user', function (done) {
      this.timeout(4000);
      helpscout.identify(identify, settings, function(err, res){
        if (err) return done(err);
        res.item.emails[0].value.should.eql(identify.email());
        done();
      });
    });

    it('should be able to identify an existing user', function (done) {
      this.timeout(4000);
      var identify = helpers.identify({ email: 'calvin@segment.io' });
      helpscout.identify(identify, settings, done);
    });
  });


  describe('.alias()', function () {
    it('should do nothing on alias', function (done) {
      helpscout.alias(helpers.alias(), settings, done);
    });
  });


  describe('._getUser()', function () {

    it('should error on an invalid key', function (done) {
      var settings = { apiKey : 'segment' }
        , email    = 'calvin@segment.io';
      helpscout._getUser({ email : email }, settings, function (err, user) {
        should.exist(err);
        err.status.should.eql(401);
        should.not.exist(user);
        done();
      });
    });

    it('should not return a non-existent user', function (done) {
      var email = 'non-existent@segment.io';
      helpscout._getUser({ email : email }, settings, function (err, user) {
        should.not.exist(err);
        should.not.exist(user);
        done();
      });
    });

    it('should return an existing user', function (done) {
      var identify = helpers.identify({ email: 'calvin@segment.io' })
      var email = identify.email();
      helpscout._getUser({ email : email }, settings, function (err, user) {
        should.not.exist(err);
        should.exist(user);
        user.firstName.should.eql(identify.firstName());
        user.lastName.should.eql(identify.lastName());
        done();
      });
    });
  });
});
