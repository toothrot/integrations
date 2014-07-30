
var test = require('segmentio-integration-tester');
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

  beforeEach(function(){
    stacklead = new Stacklead;
    settings = { apiKey: '271ac47ea1' };
  });

  it('should have correct settings', function(){
    test(stacklead)
      .name('StackLead')
      .endpoint('https://stacklead.com/api')
      .retries(2);
  });

  it('should use the mapper', function(){
    assert.equal(stacklead.mapper, mapper);
  });

  describe('.enabled()', function(){
    it('should be disabled for messages without emails', function(){
      test(stacklead).disabled(new facade.Identify({ channel: 'server' }));
      test(stacklead).disabled(new facade.Identify({ channel: 'client' }));
    });

    it('should be disabled for manually', function(){
      test(stacklead).disabled(new facade.Identify({ options: { StackLead: false }}));
    });

    it('should be enabled for messages with emails', function(){
      test(stacklead).enabled(new facade.Identify({
        channel: 'server',
        traits: {
          email: 'customer@email.com'
        }
      }));
      test(stacklead).enabled(new facade.Identify({
        channel: 'client',
        traits: {
          email: 'customer@email.com'
        }
      }));
    });
  });

  describe('.validate()', function(){
    it('should require an api key', function(){
      test(stacklead).invalid({}, { apiKey: '' });
      test(stacklead).invalid({}, {});
      test(stacklead).valid({}, { apiKey: 'xxx' });
    });

    it('should validate deliver_method if set', function(){
      test(stacklead).invalid({}, { apiKey: 'xxx', deliveryMethod: 'bad' });
      test(stacklead).invalid({}, { apiKey: '', deliveryMethod: 'email' });
      test(stacklead).valid({}, { apiKey: 'xxx', deliveryMethod: 'email' });
      test(stacklead).valid({}, { apiKey: 'xxx', deliveryMethod: 'webhook' });
    });
  });

  describe('.identify()', function(){
    it('should identify successfully', function(done){
      var identify = helpers.identify();
      test(stacklead)
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
      test(stacklead)
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
      test(stacklead)
        .set(settings)
        .track(track)
        .requests(0)
        .end(done);
    });
  });

  describe('.group()', function(){
    it('should do nothing', function(done){
      var group = helpers.group();
      test(stacklead)
        .set(settings)
        .group(group)
        .requests(0)
        .end(done);
    });
  });

  describe('.page()', function(){
    it('should do nothing', function(done){
      var page = helpers.page();
      test(stacklead)
        .set(settings)
        .page(page)
        .requests(0)
        .end(done);
    });
  });
});
