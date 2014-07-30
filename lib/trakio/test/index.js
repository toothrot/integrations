
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var mapper = require('../mapper');
var should = require('should');
var assert = require('assert');
var extend = require('extend');
var TrakIO = require('..');

describe('trak.io', function(){
  var settings;
  var tio;

  beforeEach(function(){
    tio = new TrakIO;
    settings = { token: '740d36a79fb593bbc034a3ac934bc04f5a591c0c' };
  });

  it('should have the correct settings', function(){
    test(tio)
      .name('trak.io')
      .endpoint('https://api.trak.io/v1')
      .retries(2);
  });

  it('should use the mapper', function(){
    assert.equal(mapper, tio.mapper);
  });

  describe('.enabled()', function(){
    it('should only be enabled for server side messages', function(){
      test(tio).enabled(new facade.Alias({ channel : 'server' }));
      test(tio).disabled(new facade.Alias({ channel : 'client' }));
      test(tio).disabled(new facade.Alias({}));
    });
  });

  describe('.validate()', function () {
    it('should require a token', function () {
      test(tio).invalid({}, {});
      test(tio).invalid({}, { token : ''});
    });

    it('should validate with the required settings', function () {
      test(tio).valid({}, { token : 'xxx' });
    });
  });

  describe('.track()', function () {
    it('should get a good response from the API', function (done) {
      var track = helpers.track();
      test(tio)
        .set(settings)
        .track(track)
        .sends({
          data: {
            distinct_id: track.userId(),
            event: track.event(),
            properties: track.properties(),
            time: track.timestamp().toISOString()
          }
        })
        .expects(200, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var track = helpers.track();
      test(tio)
        .set({ token: 'x' })
        .track(track)
        .expects(401,  function(err){
          assert(err);
          done();
        });
    });
  });

  describe('.identify()', function () {
    it('should get a good response from the API', function (done) {
      var identify = helpers.identify();
      test(tio)
        .set(settings)
        .identify(identify)
        .sends({
          data: {
            distinct_id: identify.userId(),
            properties: extend(identify.traits(), {
              email: identify.email(),
              name: identify.name(),
              gender: identify.proxy('traits.gender'),
              position: identify.proxy('traits.position'),
              company: identify.proxy('traits.company'),
              positions: identify.proxy('traits.positions'),
              industry: identify.proxy('traits.industry'),
              location: identify.proxy('traits.location'),
              languages: identify.proxy('traits.languages'),
              birthday: identify.proxy('traits.birthday'),
              tags: identify.proxy('traits.tags'),
              headline: identify.proxy('traits.headline'),
              account_id: identify.proxy('traits.account')
            })
          }
        })
        .expects(200, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var identify = helpers.identify();
      test(tio)
        .set({ token: 'x' })
        .identify(identify)
        .expects(401,  function(err){
          assert(err);
          done();
        });
    });
  });

  describe('.alias()', function () {
    it('should get a good response from the api', function (done) {
      var alias = helpers.alias();
      test(tio)
        .set(settings)
        .alias(alias)
        .sends({
          data: {
            distinct_id: alias.from(),
            alias: alias.to()
          }
        })
        .expects(200, done);
    });

    it('will error on an invalid set of keys', function (done) {
      var alias = helpers.alias();
      test(tio)
        .set({ token: 'x' })
        .alias(alias)
        .expects(401,  function(err){
          assert(err);
          done();
        });
    });
  });
});
