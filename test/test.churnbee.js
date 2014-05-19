
var test = require('segmentio-integration-tester');
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
    var track = helpers.track();

    it('should track register correctly', function(done){
      var events = {};
      events[track.event()] = 'register';

      test(churnbee)
        .set({ apiKey: settings.apiKey })
        .set({ events: events })
        .track({ event: track.event(), userId: track.userId() })
        .sends('?accessToken=' + settings.apiKey)
        .expects(200, done);
    })

    it('should track register again and not error', function(done){
      test(churnbee)
        .set(settings)
        .track({ event: 'register', userId: track.userId() })
        .end(function(err, res){
          if (err) return done(err);
          done();
        });
    })

    it('should track login', function(done){
      test(churnbee)
        .set(settings)
        .set({ events: { baz: 'login' } })
        .track({ event: 'baz', userId: track.userId() })
        .expects(200, done);
    })

    it('should error on incorrect settings', function(done){
      var track = helpers.track({ event: 'baz' });
      churnbee.track(track, {}, function(err){
        should.exist(err);
        done();
      });
    })

    it('should send properties', function(done){
      var t = helpers.track.bare({
        userId: track.userId(),
        event: 'refund',
        timestamp: new Date('1/1/2013'),
        properties: {
          plan: 'enterprise',
          description: 'reason',
          revenue: 9.99
        }
      });

      var query = '?accessToken=' + settings.apiKey
        + '&reason=reason'
        + '&plan=enterprise'
        + '&custom[plan]=enterprise'
        + '&custom[description]=reason'
        + '&custom[revenue]=9.99'
        + '&amount=9.99'
        + '&dateTime=2012-12-31T22%3A00%3A00.000Z'

      test(churnbee)
        .set(settings)
        .track(t)
        .sends(query)
        .expects(200, done);
    })
  })
})
