
var Test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var mapper = require('../mapper');
var fmt = require('util').format;
var assert = require('assert');
var should = require('should');
var Hubspot = require('..');
var uid = require('uid');

describe('HubSpot', function(){
  var settings;
  var payload;
  var hubspot;
  var test;

  beforeEach(function(){
    payload = {};
    settings = {
      portalId: 62515,
      apiKey: 'demo'
    };
    hubspot = new Hubspot(settings);
    test = Test(hubspot, __dirname);
    test.mapper(mapper);
  });

  it('should have correct settings', function(){
    test
      .name('HubSpot')
      .ensure('settings.portalId')
      .ensure('settings.apiKey')
      .ensure('message.email')
      .channels(['server'])
      .retries(2);
  });

  describe('.validate()', function(){
    var msg;

    beforeEach(function(){
      msg = {
        properties: {
          email: 'jd@example.com'
        }
      };
    });

    it('should be invalid without portalId', function(){
      delete settings.portalId;
      test.invalid(msg, settings);
    });

    it('should be invalid without apiKey', function(){
      delete settings.apiKey;
      test.invalid(msg, settings);
    });

    it('should be valid with apiKey and portalId', function(){
      test.valid(msg, settings);
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map basic track', function(){
        test.maps('track-basic', {
          portalId: 'portal-id'
        });
      });
    });

    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic');
      });

      it('should fallback to .jobTitle', function(){
        test.maps('identify-job-title');
      });

      it('should map add createdate', function(){
        test.maps('identify-created');
      });

      it('should grab address traits from .address if possible', function(){
        test.maps('identify-address');
      });

      it('should fallback to .zip', function(){
        test.maps('identify-zip');
      });
    });
  });

  describe('.identify()', function(){
    it('should identify successfully', function (done) {
      var msg = helpers.identify();

      payload.properties = [
        { property: 'last_name', value: 'Doe' },
        { property: 'company', value: 'Segment.io' },
        { property: 'firstname', value: 'John' },
        { property: 'lastname', value: 'Doe' },
        { property: 'email', value: msg.email() },
        { property: 'phone', value: '5555555555' },
        { property: 'city', value: 'San Francisco' },
        { property: 'state', value: 'CA' }
      ];

      test
        .set(settings)
        .identify(msg)
        .sends(payload)
        .expects(200)
        .end(done);
    });

    it('should identify a second time', function (done) {
      test
        .identify(helpers.identify())
        .set(settings)
        .expects(204)
        .end(done);
    });

    it('should identify with "date" objects', function (done) {
      // the hubspot demo key has this as the only "date" type
      var msg = helpers.identify({
        traits: {
          offerextractdate: new Date()
        }
      });

      payload.properties = [
        { property: 'last_name', value: 'Doe' },
        { property: 'company', value: 'Segment.io' },
        { property: 'firstname', value: 'John' },
        { property: 'lastname', value: 'Doe' },
        { property: 'email', value: msg.email() },
        { property: 'phone', value: '5555555555' },
        { property: 'city', value: 'San Francisco' },
        { property: 'state', value: 'CA' }
      ];

      test
        .identify(msg)
        .set(settings)
        .sends(payload)
        .expects(204)
        .end(done);
    });
  });

  describe('._create()', function(){
    var email = fmt('test-%s@segment.io', uid());
    var properties = [{ property: 'email', value: email }];

    it('should be able to ._create() once', function (done) {
      hubspot._create(properties, done);
    });

    it('should be able to ._update() on the second call', function (done) {
      hubspot._create(properties, done);
    });
  });

  describe('.track()', function(){
    it('should track successfully', function (done) {
      var msg = helpers.track();

      payload._a = settings.portalId;
      payload._n = msg.event();
      payload._m = msg.revenue();
      payload.address = JSON.stringify(msg.proxy('properties.address'));
      payload.email = msg.email();

      test
        .set(settings)
        .track(msg)
        .query(payload)
        .expects(200)
        .end(done);
    });
  });
});
