var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var kissmetrics = new integrations['KISSmetrics']()
  , settings = auth['KISSmetrics'];


describe('KISSmetrics', function () {

  describe('.enabled()', function () {
    it('should only be enabled for server side messages', function () {
      kissmetrics.enabled(new facade.Track({ channel : 'server' })).should.be.ok;
      kissmetrics.enabled(new facade.Track({ channel : 'client' })).should.not.be.ok;
      kissmetrics.enabled(new facade.Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {
    it('should not validate settings without an apiKey', function () {
      var identify = helpers.identify();
      kissmetrics.validate(identify, {}).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      var identify = helpers.identify();
      should.not.exist(kissmetrics.validate(identify, { apiKey : 'x' }));
    });
  });


  describe('.track()', function () {
    var track = helpers.track();
    it('should be able to track correctly', function (done) {
      kissmetrics.track(track, settings, done);
    });

    it('should prefix event properties if prefixProperties is enabled', function(){
      var result = kissmetrics.mapper.track(track, { prefixProperties: true });
      result['Baked a cake - layers'].should.eql('chocolate,strawberry,fudge');
      result['Billing Amount'].should.eql(19.95);
      result._n.should.eql('Baked a cake');
    });

    it('should not prefix event properties if prefixProperties is disabled', function(){
      var result = kissmetrics.mapper.track(track, {});
      result['layers'].should.eql('chocolate,strawberry,fudge');
      result['Billing Amount'].should.eql(19.95);
      result._n.should.eql('Baked a cake');
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      kissmetrics.identify(identify, settings, done);
    });
  });

  describe('.alias()', function () {
    var alias = helpers.alias();
    it('should be able to alias properly', function (done) {
      kissmetrics.alias(alias, settings, done);
    });
  });
});