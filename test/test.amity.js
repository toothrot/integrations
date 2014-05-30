
var Amity = require('..').Amity;
var settings = require('./auth').Amity;
var helpers = require('./helpers');
var Track = require('segmentio-facade').Track;
var Identify = require('segmentio-facade').Identify;
var assert = require('assert');
var amity = new Amity;
var should = require('should');

describe('Amity', function(){

  describe('.validate()', function(){
    it('should validate when client_id, client_secret, workspace_id, and external_id_source are given', function(){
      var msg = new Track({});
      should.not.exist(amity.validate(msg, settings));
    });

    it('should error when any of the settings are missing', function(){
      var msg = new Track({});

      should.not.exist(amity.validate(msg, { client_id: 'abc', client_secret: 'def', workspace_id: '1' }));
      amity.validate(msg, { client_id: 'abc', client_secret: 'def', external_id_source: 'salesforce' }).should.be.instanceOf(Error);
      amity.validate(msg, { client_id: 'abc', workspace_id: '1', external_id_source: 'salesforce' }).should.be.instanceOf(Error);
      amity.validate(msg, { client_secret: 'def', workspace_id: '1', external_id_source: 'salesforce' }).should.be.instanceOf(Error);
    });
  });

  describe('.identify()', function(){
    it('should identify user successfully', function(done){
      var msg = helpers.identify({  userId: "1234",
                                    traits: {
                                        full_name: "Sir API Guy",
                                        email: 'amir@segment.io'
                                    }
                                });
      amity.identify(msg, settings, done);
    });

    it('should identify again', function(done){
      var msg = helpers.identify({ traits: { email: 'amir@segment.io' } });
      amity.identify(msg, settings, done);
    });
  });

  describe('.group()', function(){
    it('should be able to group properly', function(done){
      var msg = helpers.group({traits: {name: "test account"}});
        amity.group(msg, settings, done);
    });
  });

  describe('.track()', function(){
    it('should track successfully', function(done){
      var msg = helpers.track({userId: settings.client_id, event: 'A new event', properties: { name: 'Amity' }});
      amity.track(msg, settings, done);
    });
  });
});