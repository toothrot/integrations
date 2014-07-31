
var test = require('segmentio-integration-tester');
var helpers = require('../../../test/helpers');
var facade = require('segmentio-facade');
var assert = require('assert');
var should = require('should');
var KeenIO = require('..');

describe('Keen IO', function () {
  var settings;
  var keen;

  beforeEach(function(){
    keen = new KeenIO;
    settings = {
      projectId: '5181bcd23843312d87000000',
      writeKey: '6d5c9e2365324fa4a631e88cd4ce7df3ca4bf41e5a9a29e48c2dfb57408bb978f5d2e6d77424fa14c9d167c72d8e1d618c7eea178ecf5934dc8d456e0114ec81112f81e8df9507a31b7bfee9cbd00944f59d54f199f046263578ded79b62c33a435f17907bffae8fd8e109086eb53f1b'
    };
  });

  it('should have the correct settings', function(){
    test(keen)
      .name('Keen IO')
      .endpoint('https://api.keen.io/3.0')
      .retries(2);
  });

  describe('.enabled()', function () {
    it('should be enabled for server side messages', function(){
      test(keen).enabled({ channel: 'server' });
    });

    it('should be disabled for other channels', function(){
      test(keen).disabled({ channel: 'client' });
      test(keen).disabled({ channel: 'mobile' });
    });
  });


  describe('.validate()', function () {
    it('should be invalid when .projectId is missing', function(){
      delete settings.projectId;
      test(keen).invalid({}, settings);
    });

    it('should be invalid when .writeKey is missing', function(){
      delete settings.writeKey;
      test(keen).invalid({}, settings);
    });

    it('should be valid when .writeKey and .projectId are given', function(){
      test(keen).valid({}, settings);
    });
  });

  describe('mapper', function(){
    describe('track', function(){
      it('should map basic track message', function(){
        test(keen, __dirname).fixture('basic');
      });

      it('should fallback to .anonymousId', function(){
        test(keen, __dirname).fixture('anonymous-id');
      });

      it('should respect .integrations["Keen IO"].traits', function(){
        test(keen, __dirname).fixture('traits');
      });

      it('should add ip addon when .ipAddon is `true`', function(){
        test(keen, __dirname).fixture('ip-addon', {
          ipAddon: true
        });
      });

      it('should add user-agent addon when .uaAddon is `true`', function(){
        test(keen, __dirname).fixture('user-agent-addon', {
          uaAddon: true
        });
      });

      it('should add url-parser addon when `.urlAddon` is `true`', function(){
        test(keen, __dirname).fixture('url-addon', {
          urlAddon: true
        });
      });

      it('should respect addon options', function(){
        test(keen, __dirname).fixture('addons', {
          ipAddon: true,
          uaAddon: true,
          urlAddon: true
        });
      });
    });
  });

  describe('.track()', function () {
    it('should track correctly', function (done) {
      test(keen)
        .set(settings)
        .track(helpers.track())
        .expects(200)
        .end(done);
    });

    it('should error on invalid creds', function(done){
      test(keen)
        .track(helpers.track())
        .error(done);
    });
  });
});
