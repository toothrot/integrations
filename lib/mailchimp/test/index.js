
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var object = require('obj-case');
var should = require('should');
var assert = require('assert');
var Mailchimp = require('..');
var Identify = facade.Identify;

describe('MailChimp', function(){
  var mailchimp;
  var settings;
  var payload;
  var test;

  beforeEach(function(){
    payload = {};
    settings = {
      datacenter: 'us2',
      listId: '2875b61629',
      apiKey: '859e55635946cd5498f3e909b806e6ba-us2'
    };
    mailchimp = new Mailchimp(settings);
    test = Test(mailchimp, __dirname);
  });

  it('should have correct settings', function(){
    test
      .name('MailChimp')
      .channels(['server', 'mobile', 'client'])
      .ensure('settings.datacenter')
      .ensure('settings.apiKey')
      .ensure('settings.listId')
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

    it('should be invalid if .listId is missing', function(){
      delete settings.listId;
      test.invalid(msg, settings);
    });

    it('should be invalid if .datacenter is missing', function(){
      delete settings.datacenter;
      test.invalid(msg, settings);
    });

    it('should be invalid if .email is missing', function(){
      delete msg.traits.email;
      test.invalid(msg, settings);
    });

    it('should be valid when settings are complete', function(){
      test.valid(msg, settings);
    });
  });

  describe('mapper', function(){
    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic', {
          apiKey: 'some-api-key',
          listId: 'some-list-id'
        });
      });
    });
  });

  describe('.identify()', function(){
    it('should get a good response from the API', function(done){
      var msg = helpers.identify();

      payload.apikey = settings.apiKey;
      payload.id = settings.listId;
      payload.double_optin = false;
      payload.send_welcome = false;
      payload.update_existing = true;
      payload.replace_interests = false;
      payload.email = { email: msg.email() };
      var vars = payload.merge_vars = msg.traits();
      delete vars.object;
      vars.FNAME = msg.firstName();
      vars.LNAME = msg.lastName();
      vars.USERID = msg.userId();

      object.del(vars, 'email')
      object.del(vars, 'firstName');
      object.del(vars, 'lastName');

      test
        .set(settings)
        .identify(msg)
        .sends(payload)
        .expects(200)
        .end(done);
    });

    it('will error on an invalid set of keys', function(done){
      test
        .set({ apiKey: 'x' })
        .set({ listId: 'x' })
        .identify(helpers.identify())
        .error(done);
    });
  });
});
