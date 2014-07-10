
var integration = require('segmentio-integration');
var ValidationError = integration.errors.Validation;
var facade = require('segmentio-facade');
var Track = facade.Track;
var Identify = facade.Identify;
var settings = require('./auth').ChurnBee;
var helpers = require('./helpers');
var integrations = require('..');
var churnbee = new integrations.ChurnBee;
var should = require('should');

describe('ChurnBee', function(){
  describe('.enabled()', function(){
    it('should be enabled for server messages', function(){
      churnbee.enabled(new Track({
        userId: 'userId',
        channel: 'server'
      })).should.be.ok;
    })

    it('should be enabled for mobile messages', function(){
      churnbee.enabled(new Track({
        userId: 'userId',
        channel: 'mobile'
      })).should.be.ok;
    })

    it('should not be enabled for client messages', function(){
      churnbee.enabled(new Track({
        userId: 'userId',
        channel: 'client'
      })).should.not.be.ok;
    })

    it('should not be enabled if .userId() is not given', function(){
      churnbee.enabled(new Track({
        channel: 'server'
      })).should.not.be.ok;
    })

    it('should not be enabled if .event() does not exist', function(){
      churnbee.enabled(new Identify({
        channel: 'server',
        userId: 'userId',
      })).should.not.be.ok;
    });
  })

  describe('.validate()', function(){
    it('should error if apiKey is missing', function(){
      var track = helpers.track();
      var err = churnbee.validate(track, {});
      err.message.should.eql('"ChurnBee" integration requires "apiKey"');
    })

    it('should error if the event is not supported', function(){
      var track = helpers.track();
      churnbee.validate(track, settings).should.be.instanceof(ValidationError);
    })

    it('should not error if event is supported', function(){
      var track = helpers.track({ event: 'register' });
      should.not.exist(churnbee.validate(track, settings));
    })

    it('should not error if event is in .events{} map', function(){
      var track = helpers.track({ event: 'baz' });
      var conf = { apiKey: settings.apiKey };
      conf.events = { baz: 'register' };
      should.not.exist(churnbee.validate(track, conf));
    })
  })

  describe('.track()', function(){
    var conf;

    beforeEach(function(){
      conf = { apiKey: settings.apiKey };
    })

    it('should track register correctly', function(done){
      var track = helpers.track({ event: 'baz', userId: 'sio' });
      conf.events = { Baz: 'register' };
      churnbee.track(track, conf, done);
    })

    it('should track register again', function(done){
      var track = helpers.track({ event: 'register', userId: 'sio' });
      churnbee.track(track, settings, done);
    })

    it('should track login', function(done){
      var track = helpers.track({ event: 'baz', userId: 'sio' });
      conf.events = { baz: 'login' };
      churnbee.track(track, conf, function(err, res){
        if (err) return done(err);
        res.status.should.eql(200);
        done();
      });
    })

    it('should error on incorrect settings', function(done){
      var track = helpers.track({ event: 'baz' });
      conf.apiKey = 'x';
      conf.events = { baz: 'login' };
      churnbee.track(track, conf, function(err){
        should.exist(err);
        done();
      });
    })

    it('should accept array of events', function(done){
      var track = helpers.track({ event: 'baz', userId: 'sio' });
      conf.events = [{ key: 'baz', value: 'login' }];
      churnbee.track(track, conf, function(err, res){
        if (err) return done(err);
        done();
      });
    })
  })
})
