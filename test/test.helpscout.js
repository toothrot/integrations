var auth         = require('./auth')
  , integrations = require('..')
  , should       = require('should');


var helpscout = new integrations['HelpScout']()
  , settings  = auth['HelpScout']
  , email     = 'mordac@segment.io';


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
  });


  describe('.identify()', function () {
  });


  describe('.alias()', function () {
  });


  describe('._getByEmail()', function () {

    it('should error on an invalid key', function (done) {
      var badKey = 'segment'
        , email  = 'calvin@segment.io';
      helpscout._getByEmail(email, badKey, function (err, user) {
        should.exist(err);
        err.status.should.eql(401);
        should.not.exist(user);
        done();
      });
    });

    it('should not return a non-existent user', function (done) {
      var email = 'non-existent@segment.io';
      helpscout._getByEmail(email, settings.apiKey, function (err, user) {
        should.not.exist(err);
        should.not.exist(user);
        done();
      });
    });

    it('should return an existing user', function (done) {
      helpscout._getByEmail(email, settings.apiKey, function (err, user) {
        should.not.exist(err);
        should.exist(user);
        done();
      });
    });
  });

  describe('._updateUser()', function () {
    it('should properly update a user', function (done) {



    });
  });


  describe('._createUser()', function () {


  });

});