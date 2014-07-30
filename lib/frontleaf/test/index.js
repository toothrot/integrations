
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var should = require('should');
var assert = require('assert');
var Frontleaf = require('..');

describe('Frontleaf', function () {
  var frontleaf;
  var settings;
  var payload;

  beforeEach(function(){
    frontleaf = new Frontleaf;
    payload = {};
    settings = {
      token: 'FTWe9sfDz6DyZA8xxtAIGwRUMOMX6mgL',
      stream: 'test'
    };
  });

  it('should have the correct settings', function(){
    test(frontleaf)
      .name('Frontleaf')
      .endpoint('https://api.frontleaf.com/api/track')
      .retries(2);
  });

  describe('.enabled()', function () {
    it('should be enabled for server side messages', function(){
      test(frontleaf).enabled({
        channel: 'server',
        userId: 'user-id'
      });
    });

    it('should be disabled for all other channels', function(){
      test(frontleaf).disabled({
        channel: 'client',
        userId: 'user-id'
      });
    });

    it('should be disabled if userId is missing', function(){
      test(frontleaf).disabled({
        channel: 'server'
      });
    });
  });

  describe('.validate()', function () {
    it('should be invalid if token is missing', function(){
      delete settings.token;
      test(frontleaf).invalid({}, settings);
    });

    it('should be invalid if stream is missing', function(){
      delete settings.stream;
      test(frontleaf).invalid({}, settings);
    });

    it('should be valid when stream and token are given', function(){
      test(frontleaf).valid({}, settings);
    });
  });

  describe('.track()', function () {
    it('should be able to track correctly', function (done) {
      var msg = helpers.track();

      payload.token = settings.token;
      payload.stream = settings.stream;
      payload.timestamp = msg.timestamp().getTime();
      payload.userId = msg.userId();
      payload.userData = frontleaf.mapper._clean(msg.traits());
      payload.eventData = frontleaf.mapper._clean(msg.properties());
      payload.event = msg.event();

      test(frontleaf)
        .set(settings)
        .track(msg)
        .sends(payload)
        .expects(200, done);
    });
  });

  describe('.group()', function () {
    it('should be able to group properly', function (done) {
      var msg = helpers.group();

      payload.token = settings.token;
      payload.stream = settings.stream;
      payload.timestamp = msg.timestamp().getTime();
      payload.userId = msg.userId();
      payload.accountId = msg.groupId();
      payload.accountName = msg.proxy('traits.name');
      payload.accountData = frontleaf.mapper._clean(msg.traits());

      test(frontleaf)
        .set(settings)
        .group(msg)
        .sends(payload)
        .expects(200, done);
    });
  });


  describe('.identify()', function () {
    it('should be able to identify correctly', function (done) {
      var msg = helpers.identify();

      payload.token = settings.token;
      payload.stream = settings.stream;
      payload.timestamp = msg.timestamp().getTime();
      payload.userId = msg.userId();
      payload.userName = msg.name() || msg.username();
      payload.userData = frontleaf.mapper._clean(msg.traits());

      test(frontleaf)
        .set(settings)
        .identify(msg)
        .sends(payload)
        .expects(200, done);
    });
  });

  describe('.page()', function () {
    it('should do nothing', function (done) {
      frontleaf.page({}, settings, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  describe('.screen()', function () {
    it('should do nothing', function (done) {
      frontleaf.screen({}, settings, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  describe('._clean()', function () {
    it('should properly clean and flatten the source data', function (done) {
      var result = frontleaf.mapper._clean({
        id : 123456,
        name : "Delete Me",
        layers  : ['chocolate', 'strawberry', 'fudge'],
        revenue : 19.95,
        numLayers : 10,
        whoCares: null,
        fat : 0.02,
        bacon : '1',
        date : (new Date()).toISOString(),
        address : {
          state : 'CA',
          zip  : 94107,
          city : 'San Francisco'
        }
      })

      result.should.not.have.property('id');
      result.should.not.have.property('name');
      result.should.not.have.property('whoCares');
      result.should.have.property('address state', 'CA');
      result.should.have.property('layers', 'chocolate,strawberry,fudge');

      done();
    });
  });
});
