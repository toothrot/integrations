var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');


var frontleaf = new integrations['Frontleaf']()
  , settings = auth['Frontleaf'];

var testEndpoint = frontleaf.endpoint = 'https://demo.frontleaf.com/api/track';

describe('Frontleaf', function () {

  describe('env', function () {
    it('should point to our test system', function() {
      should.equal(frontleaf.endpoint, testEndpoint);
    });
  });

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

  describe('._clean()', function () {
    it('should properly clean and flatten the source data', function (done) {
      var result = frontleaf.mapper._clean({
        id : 123456,
        name : "Delete Me",
        layers  : ['chocolate', 'strawberry', 'fudge'],
        revenue : 19.95,
        numLayers : 10,
        whoCares: null,
        fat : 0.02,
        bacon : '1',
        date : (new Date()).toISOString(),
        address : {
          state : 'CA',
          zip  : 94107,
          city : 'San Francisco'
        }
      })

      result.should.not.have.property('id');
      result.should.not.have.property('name');
      result.should.not.have.property('whoCares');
      result.should.have.property('address state', 'CA');
      result.should.have.property('layers', 'chocolate,strawberry,fudge');

      done();
    });
  });
});