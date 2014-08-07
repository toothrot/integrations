
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var mapper = require('../mapper');
var should = require('should');
var assert = require('assert');
var Calq = require('..');

describe('Calq', function () {
  var settings;
  var calq;

  beforeEach(function(){
    calq = new Calq;
    settings = { writeKey: '0e116d3930b329831f146716c3667dfe' };
  });

  it('should have correct settings', function(){
    test(calq)
      .name('Calq')
      .option('writeKey', { required: true })
      .channels(['server', 'mobile', 'client'])
      .retries(3);
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map basic track', function(){
        test(calq, __dirname).fixture('track-basic', settings);
      });

      it('should map full track', function(){
        test(calq, __dirname).fixture('track-full', settings);
      });
    });

    describe('alias', function(){
      it('should map alias', function(){
        test(calq, __dirname).fixture('alias', settings);
      });
    });

    describe('identify', function(){
      it('should map basic identify', function(){
        test(calq, __dirname).fixture('identify-basic', settings);
      });
    });
  });

  describe('.track()', function () {
    it('should be able to track correctly', function (done) {
      calq.track(helpers.track(), settings, done);
    });

    it('should be able to track a bare call correctly', function (done) {
      calq.track(helpers.track.bare(), settings, done);
    });

    it('should error on an invalid write key', function (done) {
      calq.track(helpers.track(), { writeKey: 'bad_key' }, function (err) {
        should.exist(err);
        err.status.should.eql(400);
        done();
      });
    });
  });

  describe('.identify()', function () {
    it('should be able to identify correctly', function (done) {
      calq.identify(helpers.identify(), settings, done);
    });
  });

  describe('.alias()', function () {
    it('should be able to alias properly', function (done) {
      calq.alias(helpers.alias(), settings, done);
    });
  });
});
