
var Tester = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var mapper = require('../mapper');
var crypto = require('crypto');
var assert = require('assert');
var Woopra = require('..');

describe('Woopra', function(){
  var woopra;
  var settings;
  var test;

  beforeEach(function(){
    settings = { domain: 'ivolo.me' };
    woopra = new Woopra;
    test = Tester(woopra);
  });

  it('should have the correct settings', function(){
    test
      .name('Woopra')
      .endpoint('http://www.woopra.com/track')
      .retries(2);
  });

  describe('.enabled()', function(){
    it('should only be enabled for server side messages', function(){
      test.enabled({ channel: 'server' });
      test.disabled({ channel: 'client' });
      test.disabled({});
    });
  });

  describe('.validate()', function(){
    it('should require a domain', function(){
      test.valid({}, { domain: 'xxx' });
      test.invalid({}, { domain: '' });
      test.invalid({}, {});
    });
  });

  describe('.mapper', function(){
    it('should use the mapper', function(){
      assert.equal(mapper, woopra.mapper);
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

      test
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

      test
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
