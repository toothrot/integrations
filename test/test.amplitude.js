var auth         = require('./auth.json')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should')
  , amplitude    = new integrations['Amplitude']()
  , settings     = auth['Amplitude'];

describe('Amplitude', function() {

  describe('.validate()', function() {
    it('should require an api key', function() {
      amplitude.validate({}, {}).should.be.an.instanceOf(Error);
    });
  });

  describe('.track()', function() {
    it('should be able to track correctly', function(done) {
      amplitude.track(helpers.track(), settings, done);
    });
  });
});
