
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
    settings = { apiKey: '271ac47ea1' };
    stacklead = new Stacklead(settings);
    test = Test(stacklead, __dirname);
  });

  it('should have correct settings', function(){
    test
      .name('StackLead')
      .endpoint('https://stacklead.com/api')
      .channels(['server', 'client'])
      .ensure('settings.apiKey')
      .ensure('message.email')
      .retries(2);
  });

  describe('.validate()', function(){
    var msg;

    beforeEach(function(){
      msg = {
        type: 'identify',
        traits: {
          email: 'jd@example.com'
        }
      };
    });

    it('should be invalid if .apiKey is missing', function(){
      delete settings.apiKey;
      test.invalid(msg, settings);
    });

    it('should be invalid if .email is missing', function(){
      delete msg.traits.email;
      test.invalid(msg, settings);
    });

    it('should be invalid if delivery method is not email or webhook', function(){
      settings.deliveryMethod = 'foo';
      test.invalid(msg, settings);
    });

    it('should be valid if delivery method is email or webhook', function(){
      settings.deliveryMethod = 'email';
      test.valid(msg, settings);
      settings.deliveryMethod = 'webhook';
      test.valid(msg, settings);
    });

    it('should be valid if settings are complete', function(){
      test.valid(msg, settings);
    });
  });

  describe('mapper', function(){
    describe('identify', function(){
      it('should map basic identify', function(){
        test.set({ deliveryMethod: 'method' });
        test.maps('identify-basic');
      });

      it('should map identify with .address.* properly', function(){
        test.set({ deliveryMethod: 'method' });
        test.maps('identify-address');
      });
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
          last_name: identify.lastName(),
          website: identify.website()
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
          delivery_method: 'webhook',
          website: identify.website()
        })
        .expects(200, done);
    });
  });
});
