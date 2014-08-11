
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
    mailchimp = new Mailchimp;
    test = Test(mailchimp, __dirname);
    payload = {};
    settings = {
      datacenter: 'us2',
      listId: '2875b61629',
      apiKey: '859e55635946cd5498f3e909b806e6ba-us2'
    };
  });

  it('should have correct settings', function(){
    test
      .name('MailChimp')
      .retries(2);
  });

  describe('.enabled()', function(){
    it('should be enabled on all channels', function(){
      test.server({ userId: 'jd@example.com' });
      test.mobile({ userId: 'jd@example.com' });
      test.client({ userId: 'jd@example.com' });
    });

    it('should be disabled if email is missing', function(){
      test.disabled({ userId: '1' });
    });
  });


  describe('.validate()', function(){
    it('should be invalid if .apiKey is missing', function(){
      delete settings.apiKey;
      test.invalid({}, settings);
    });

    it('should be invalid if .listId is missing', function(){
      delete settings.listId;
      test.invalid({}, settings);
    });

    it('should be invalid if .datacenter is missing', function(){
      delete settings.datacenter;
      test.invalid({}, settings);
    });

    it('should be valid when settings are complete', function(){
      test.valid({}, settings);
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
      var identify = helpers.identify();
      mailchimp.identify(identify, { apiKey : 'x', listId : 'x' }, function (err) {
        should.exist(err);
        done();
      });
    });
  });

  describe('.track()', function(){
    it('should do nothing', function(done){
      var track = helpers.track();
      mailchimp.track(track, settings, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });


  describe('.alias()', function(){
    it('should do nothing', function(done){
      mailchimp.alias({}, {}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});
