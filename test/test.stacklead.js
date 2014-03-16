var auth         = require('./auth')
  , facade       = require('segmentio-facade')
  , helpers      = require('./helpers')
  , integrations = require('..')
  , should       = require('should');

var stacklead = new integrations['StackLead']()
  , settings = auth['StackLead'];

describe('StackLead', function () {

  describe('.enabled()', function () {
    it('should be disabled for messages without emails', function () {
      stacklead.enabled(new facade.Identify({ channel : 'server' })).should.not.be.ok;
      stacklead.enabled(new facade.Identify({ channel : 'client' })).should.not.be.ok;
    });

    it('should be enabled for messages with emails', function () {
      stacklead.enabled(new facade.Identify({
        channel: 'server',
        traits: {
          email: 'customer@email.com'
        }
      })).should.be.ok;
      stacklead.enabled(new facade.Identify({
        channel: 'client',
        traits: {
          email: 'customer@email.com'
        }
      })).should.be.ok;
    });
  });

  describe('.validate()', function () {
    it('should require an api key', function () {
      stacklead.validate({}, { apiKey : '' }).should.be.an.instanceOf(Error);
      stacklead.validate({}, {}).should.be.an.instanceOf(Error);
      should.not.exist(stacklead.validate({}, { apiKey : 'xxx' }));
    });
  });

  describe('.validate()', function () {
    it('should validate deliver_method if set', function () {
      stacklead.validate({}, { apiKey : 'xxx', delivery_method: 'bad' }).should.be.an.instanceOf(Error);
      stacklead.validate({}, { apiKey : '', delivery_method: 'email' }).should.be.an.instanceOf(Error);
      should.not.exist(stacklead.validate({}, { apiKey : 'xxx', delivery_method: 'email' }));
      should.not.exist(stacklead.validate({}, { apiKey : 'xxx', delivery_method: 'webhook' }));
    });
  });

  describe('.identify()', function () {
    it('should identify successfully', function (done) {
      var identify = helpers.identify();
      stacklead.identify(identify, settings, done);
    });
  });

  describe('.identify()', function () {
    it('should identify successfully with webhook', function (done) {
      var newSettings = Object.create(settings);
      newSettings.delivery_method = 'webhook';
      var identify = helpers.identify();
      stacklead.identify(identify, newSettings, done);
    });
  });

  describe('.track()', function () {
    it('should do nothing', function (done) {
      var track = helpers.track();
      stacklead.track(track, settings, done);
    });
  });

  describe('.group()', function () {
    it('should do nothing', function (done) {
      var group = helpers.group();
      stacklead.group(group, settings, done);
    });
  });

  describe('.page()', function () {
    it('should do nothing', function (done) {
      var page = helpers.page();
      stacklead.page(page, settings, done);
    });
  });

});