
var Tester = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var mapper = require('../mapper');
var assert = require('assert');
var Amity = require('..');
var uid = require('uid');

describe('Amity', function() {
  var amity;
  var settings;
  var test;

  beforeEach(function(){
    // Amity has a custom endpoint
    Amity.endpoint('https://demo.getamity.com/rest/v1/activities');
    settings = {
      clientSecret: 'H3ivKzEosgPOWjpeYNwXQEvG',
      workspaceId: '53a348bdb379202fa739a9a7',
      clientId: '53a348beb379202fa739a9bd'
    };
    amity = new Amity;
    test = Tester(amity);
  });

  it('should have the correct settings', function(){
    test
      .name('Amity')
      .endpoint('https://demo.getamity.com/rest/v1/activities')
      .client()
      .server()
      .mobile()
      .retries(2);
  });

  describe('.enabled()', function(){
    it('should be for all messages', function(){
      test.enabled({ channel: 'server' });
      test.enabled({ channel: 'mobile' });
      test.enabled({ channel: 'client' });
    });
  });

  describe('.validate()', function() {
    it('should not be valid without a clientSecret', function(){
      delete settings.clientSecret
      test.invalid({}, settings);
    });

    it('should not be valid without a workspaceId', function(){
      delete settings.workspaceId
      test.invalid({}, settings);
    });

    it('should not be valid without a clientId', function(){
      delete settings.clientId
      test.invalid({}, settings);
    });

    it('should be valid with the correct settings', function(){
      test.valid({}, settings);
    });
  });

  describe('mapper', function(){
    it('should use the mapper', function(){
      assert.equal(mapper, amity.mapper);
    });

    describe('track', function(){
      var track;
      function proxy(field){
        return track.proxy('properties.' + field);
      }

      it('should map track calls correctly', function(){
        track = helpers.track();
        var payload = mapper.track(track, settings);
        assert.deepEqual(payload, {
          workspace_id: settings.workspaceId,
          participant_id_source: 'ctp.app',
          participant_id: track.userId(),
          name: track.event(),
          properties:{
            'address state': proxy('address.state'),
            'address city': proxy('address.city'),
            'address zip': proxy('address.zip'),
            numLayers: proxy('numLayers'),
            revenue: proxy('revenue'),
            layers: proxy('layers'),
            bacon: proxy('bacon'),
            date: proxy('date'),
            fat: proxy('fat')
          }
        });
      });
    });

    describe('identify', function(){
      var identify;
      function proxy(field){
        return identify.proxy('traits.' + field);
      }

      it('should map identify calls correctly', function(){
        identify = helpers.identify();
        var payload = mapper.identify(identify, settings);
        assert.deepEqual(payload, {
          workspace_id: settings.workspaceId,
          participant_id: identify.userId(),
          participant_id_source: 'ctp.app',
          created_at: identify.created(),
          full_name: identify.name(),
          email: identify.email()
        });
      });
    });

    describe('group', function(){
      var group;
      function proxy(field){
        return group.proxy('traits.' + field);
      }

      it('should map group calls correctly', function(){
        group = helpers.group();
        var payload = mapper.group(group, settings);
        assert.deepEqual(payload, {
          workspace_id: settings.workspaceId,
          participant_id_source: 'ctp.app',
          participant_id: group.userId(),
          account_id_source: 'ctp.app',
          account_id: group.groupId(),
          created_at: group.created(),
          name: proxy('name')
        });
      });
    });
  });

  describe('.identify', function() {
    it('should record identify calls correctly', function(done){
      var identify = {};
      identify.userId = uid();
      identify.traits = { email: uid() + '@segment.io' };

      test
        .set(settings)
        .identify(identify)
        .expects(200, function (err, res) {
          console.log(err);
          done();
        });
    });
  });
});