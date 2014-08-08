
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var mapper = require('../mapper');
var time = require('unix-time');
var should = require('should');
var extend = require('extend');
var assert = require('assert');
var Stacklead = require('..');

describe('StackLead', function(){
  var stacklead;
  var settings;
  var test;

  beforeEach(function(){
    stacklead = new Stacklead;
    test = Test(stacklead, __dirname);
    settings = { apiKey: '271ac47ea1' };
  });

  it('should have correct settings', function(){
    test
      .name('StackLead')
      .endpoint('https://stacklead.com/api')
      .retries(2);
  });

  it('should use the mapper', function(){
    assert.equal(stacklead.mapper, mapper);
  });

  describe('.enabled()', function(){
    it('should be disabled for messages without emails', function(){
      test.disabled(new facade.Identify({ channel: 'server' }));
      test.disabled(new facade.Identify({ channel: 'client' }));
    });

    it('should be disabled for manually', function(){
      test.disabled(new facade.Identify({ options: { StackLead: false }}));
    });

    it('should be enabled for messages with emails', function(){
      test.enabled(new facade.Identify({
        channel: 'server',
        traits: {
          email: 'customer@email.com'
        }
      }));
      test.enabled(new facade.Identify({
        channel: 'client',
        traits: {
          email: 'customer@email.com'
        }
      }));
    });
  });

  describe('.validate()', function(){
    it('should require an api key', function(){
      test.invalid({}, { apiKey: '' });
      test.invalid({}, {});
      test.valid({}, { apiKey: 'xxx' });
    });

    it('should validate deliver_method if set', function(){
      test.invalid({}, { apiKey: 'xxx', deliveryMethod: 'bad' });
      test.invalid({}, { apiKey: '', deliveryMethod: 'email' });
      test.valid({}, { apiKey: 'xxx', deliveryMethod: 'email' });
      test.valid({}, { apiKey: 'xxx', deliveryMethod: 'webhook' });
    });
  });

  describe('.identify()', function(){
    it('should identify successfully', function(done){
      var identify = helpers.identify();
      test
        .set(settings)
        .identify(identify)
        .sends({
          created: time(identify.created()),
          duplicates: false,
          email: identify.email(),
          user_ip: identify.ip(),
          city: identify.proxy('traits.city'),
          state: identify.proxy('traits.state'),
          phone: identify.phone(),
          name: identify.name(),
          first_name: identify.firstName(),
          last_name: identify.lastName()
        })
        .expects(200, done);
    });

    it('should identify successfully', function(done){
      var identify = helpers.identify();
      test
        .set(extend({}, settings, { deliveryMethod: 'webhook' }))
        .identify(identify)
        .sends({
          created: time(identify.created()),
          duplicates: false,
          email: identify.email(),
          user_ip: identify.ip(),
          city: identify.proxy('traits.city'),
          state: identify.proxy('traits.state'),
          phone: identify.phone(),
          name: identify.name(),
          first_name: identify.firstName(),
          last_name: identify.lastName(),
          delivery_method: 'webhook'
        })
        .expects(200, done);
    });
  });

  describe('.track()', function(){
    it('should do nothing', function(done){
      var track = helpers.track();
      test
        .set(settings)
        .track(track)
        .requests(0)
        .end(done);
    });
  });

  describe('.group()', function(){
    it('should do nothing', function(done){
      var group = helpers.group();
      test
        .set(settings)
        .group(group)
        .requests(0)
        .end(done);
    });
  });

  describe('.page()', function(){
    it('should do nothing', function(done){
      var page = helpers.page();
      test
        .set(settings)
        .page(page)
        .requests(0)
        .end(done);
    });
  });
});
