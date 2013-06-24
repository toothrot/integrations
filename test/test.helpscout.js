var auth         = require('./auth')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var helpscout = new integrations['HelpScout']()
  , settings  = auth['HelpScout'];



describe('HelpScout', function () {

  describe('.enabled()', function () {
    it('should only be enabled for server side messages', function () {
      helpscout.enabled({ channel : 'server' }).should.be.ok;
      helpscout.enabled({ channel : 'client' }).should.not.be.ok;
      helpscout.enabled({}).should.not.be.ok;
    });
  });


  describe('.validate()', function () {

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

      helpscout.identify(identify, settings, function (err) {
        should.not.exist(err);
        helpscout._getUser(filter, settings, function (err, user) {
          should.not.exist(err);
          should.exist(user);
          should.exist(user.id);
          done();
        });
      });
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
      var identify = helpers.identify()
        , email    = identify.email();
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