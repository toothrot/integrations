
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var mapper = require('../mapper');
var time = require('unix-time');
var should = require('should');
var assert = require('assert');
var time = require('unix-time');
var Vero = require('..');

describe('Vero', function () {
  var settings;
  var vero;
  var test;

  beforeEach(function(){
    vero = new Vero;
    settings = { authToken: 'ZmEzYjZkNWZkOWY0ZDYxZmQyYTg2OGNkNzQ1ZmY2YzIyNjEwZTI4OTplNGVhZTAzZjY4NWIyNjIwNjA4ZDRkZjA3NjFkNmEyZTBmNmQzZjc3' };
    test = Test(vero, __dirname);
  });

  it('should have the correct settings', function(){
    test
      .endpoint('https://api.getvero.com/api/v2')
      .retries(2);
  });

  describe('#mapper', function(){
    it('should have a mapper', function(){
      assert.equal(mapper, vero.mapper);
    });
  });

  describe('.enabled()', function(){
    it('should not be enabled for client-side messages', function(){
      test.enabled({ channel: 'server', userId: 'userId' });
      test.disabled({ channel: 'client', userId: 'userId' });
    });
  });

  describe('.validate()', function(){
    it('should require an authToken', function(){
      test.invalid({}, { authToken: '' });
      test.invalid({}, {});
      test.valid({}, { authToken: 'xxx' });
    });
  });

  describe('mapper', function(){
    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic', {
          authToken: 'some-auth-token'
        });
      });
    });

    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic', {
          authToken: 'some-auth-token'
        });
      });
    });
  });

  describe('.track()', function(){
    it('should get a good response from the API', function(done){
      var track = helpers.track();
      test
        .set(settings)
        .track(track)
        .sends({
          auth_token: settings.authToken,
          event_name: track.event(),
          data: track.properties(),
          identity: {
            id: track.userId(),
            email: track.email()
          },
          extras: {
            created_at: time(track.timestamp())
          }
        })
        .expects(200, done);
    });
  });

  describe('.identify()', function(){
    it('should get a good response from the API', function(done){
      var identify = helpers.identify();
      test
        .set(settings)
        .identify(identify)
        .sends({
          id: identify.userId(),
          auth_token: settings.authToken,
          email: identify.email(),
          data: identify.traits()
        })
        .expects(200, done);
    });
  });

  describe('.alias()', function(){
    it('should alias correctly', function(done){
      var alias = helpers.alias();
      test
        .set(settings)
        .track(alias)
        .sends({
          auth_token: settings.authToken,
          id: alias.from(),
          new_id: alias.to()
        })
        .expects(200, done);
    });
  });
});
