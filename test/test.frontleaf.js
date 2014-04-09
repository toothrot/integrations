var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var frontleaf = new integrations['Frontleaf']()
  , settings = auth['Frontleaf'];


describe('Frontleaf', function () {

  describe('.enabled()', function () {
    it('should only be enabled for server side messages', function () {
      frontleaf.enabled(new facade.Track({ channel : 'server', userId : 'testUser' })).should.be.ok;
      frontleaf.enabled(new facade.Track({ channel : 'server' })).should.not.be.ok;
      frontleaf.enabled(new facade.Track({ channel : 'client', userId : 'testUser' })).should.not.be.ok;
      frontleaf.enabled(new facade.Track({ userId : 'testUser' })).should.not.be.ok;
      frontleaf.enabled(new facade.Track({})).should.not.be.ok;
    });
  });


  describe('.validate()', function () {
    it('should not validate settings without a token and stream', function () {
      var identify = helpers.identify();
      frontleaf.validate(identify, {}).should.be.instanceOf(Error);
    });

    it('should validate proper identify calls', function () {
      var identify = helpers.identify();
      should.not.exist(frontleaf.validate(identify, { token : 'x', stream : 'development' }));
    });
  });


  describe('.track()', function () {
    var track = helpers.track();
    it('should be able to track correctly', function (done) {
      frontleaf.track(track, settings, done);
    });
  });


  describe('.group()', function () {
    var group = helpers.group();
    it('should be able to group properly', function (done) {
      frontleaf.group(group, settings, done);
    });
  });


  describe('.identify()', function () {
    var identify = helpers.identify();
    it('should be able to identify correctly', function (done) {
      frontleaf.identify(identify, settings, done);
    });
  });

  describe('.page()', function () {
    it('should do nothing', function (done) {
      frontleaf.page({}, settings, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  describe('.screen()', function () {
    it('should do nothing', function (done) {
      frontleaf.screen({}, settings, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});