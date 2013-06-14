
var express      = require('express')
  , integrations = require('..')
  , should       = require('should')
  , cio          = new integrations['Customer.io']();


describe('Customer.io', function () {

  describe('.enabled()', function () {

    it('should only be enabled for server side messages', function () {
      cio.enabled({ channel : 'server' }).should.be.ok;
      cio.enabled({ channel : 'client' }).should.not.be.ok;
      cio.enabled({}).should.not.be.ok;
    });
  });


  describe('.validate()', function () {

    it('should require an apiKey', function () {
      cio.validate({}, { siteId : 'xxx' }).should.be.an.instanceOf(Error);
      cio.validate({}, { siteId : 'xxx', apiKey : '' }).should.be.an.instanceOf(Error);
    });

    it('should require a siteId', function () {
      cio.validate({}, { apiKey : 'xxx' }).should.be.an.instanceOf(Error);
      cio.validate({}, { siteId : '', apiKey : 'xxx' }).should.be.an.instanceOf(Error);
    });

    it('should validate with the required settings', function () {
      should.not.exist(cio.validate({}, { siteId : 'xxx', apiKey : 'xxx' }));
    });
  });


  describe('.track()', function () {

    it('should format the track request properly', function () {
    });
  });

  describe('.identify()', function () {

  });


  describe('.alias()', function () {

    it('should do nothing', function (done) {
      cio.alias({}, {}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});