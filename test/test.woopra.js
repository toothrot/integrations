var auth = require('./auth');
var assert = require('assert');
var crypto = require('crypto');
var facade = require('segmentio-facade')
var helpers = require('./helpers')
var integrations = require('..')
var should = require('should');
var test = require('segmentio-integration-tester');

/**
 * Create our integration
 */

var woopra = new integrations.Woopra;

/**
 * Store our settings
 */

var settings = auth['Woopra'];

/**
 * Run tests
 */

describe('Woopra', function(){
  describe('.enabled()', function(){
    it('should only be enabled for server side messages', function(){
      assert(test(woopra).enabled({ channel: 'server' }));
      assert(test(woopra).disabled({ channel: 'client' }));
      assert(test(woopra).disabled({}));
    });
  });

  describe('.validate()', function(){
    it('should require a domain', function(){
      assert(validate({ domain: '' }) === false);
      assert(validate({}) === false);
      assert(validate({ domain: 'xxx' }) === true);

      function validate(settings){
        var err = woopra.validate({}, settings);
        return !err;
      }
    });
  });

  describe('.track()', function(){
    it('should track successfully', function(done){
      var track = {
        properties: { revenue: 100, prop: 'prop' },
        context: { ip: '127.0.0.1' },
        timestamp: new Date(),
        userId: 'userId',
        event: 'event'
      };

      test(woopra)
        .set(settings)
        .track(track)
        .query({
          timestamp: track.timestamp.getTime().toString(),
          cookie: md5('userId'),
          host: settings.domain,
          ce_name: 'event',
          ce_revenue: '100',
          ce_prop: 'prop',
          ip: '127.0.0.1',
          timeout: '30'
        })
        .expects(200, done);
    });
  });

  describe('.identify()', function(){
    it('should identify successfully', function(done){
      var identify = {
        traits: { company: 'company', name: 'name' },
        context: { ip: '127.0.0.1' },
        timestamp: new Date(),
        userId: 'userId',
      };

      test(woopra)
        .set(settings)
        .identify(identify)
        .query({
          timestamp: identify.timestamp.getTime().toString(),
          cookie: md5('userId'),
          host: settings.domain,
          cv_company: 'company',
          cv_name: 'name',
          cv_id: 'userId',
          ip: '127.0.0.1',
          timeout: '30'
        })
        .expects(200, done);
    });
  });
});

/**
 * Hash the string for the userId
 *
 * @param {String} str
 * @return {String} [description]
 */

function md5(str){
  return crypto
    .createHash('md5')
    .update(str)
    .digest('hex');
}
