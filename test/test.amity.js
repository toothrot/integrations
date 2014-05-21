
var Amity = require('..').Amity;
var settings = require('./auth').Amity;
var helpers = require('./helpers');
var Track = require('segmentio-facade').Track;
var Identify = require('segmentio-facade').Identify;
var assert = require('assert');
var amity = new Amity;

describe('Amity', function(){

  describe('.validate()', function(){
    it('should validate when client_id, client_secret, workspace_id, and external_id_source are given', function(){
      var msg = new Track({});
      assert(null == amity.validate(msg, settings));
    });

    it('should error when any of the settings are missing', function(){
      var msg = new Track({});
      assert(amity.validate(msg, { client_id: 'abc', client_secret: 'def', workspace_id: '1' }));
      assert(amity.validate(msg, { client_id: 'abc', client_secret: 'def', external_id_source: 'salesforce' }));
      assert(amity.validate(msg, { client_id: 'abc', workspace_id: '1', external_id_source: 'salesforce' }));
      assert(amity.validate(msg, { client_secret: 'def', workspace_id: '1', external_id_source: 'salesforce' }));
    });
  });

  describe('.identify()', function(){
    it('should identify user successfully', function(done){
      var msg = helpers.identify('1234', { traits: { email: 'amir@segment.io' } });
      amity.identify(msg, settings, done);
    });

    it('should identify again', function(done){
      var msg = helpers.identify('5678', { traits: { email: 'amir@segment.io' } });
      amity.identify(msg, settings, done);
    });
  });

  describe('.group()', function(){
    it('should be able to group properly', function(){
      var msg = helpers.group();
    });
  });

  describe('.track()', function(){
    it('should track successfully', function(done){
      var msg = helpers.track({event: 'A new event', properties: { name: 'Amity' }});
      amity.track(msg, settings, done);
    });
  });
});