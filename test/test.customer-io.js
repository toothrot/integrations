
var test         = require('segmentio-integration-tester');
var facade       = require('segmentio-facade');
var helpers      = require('./helpers');
var integrations = require('..');
var should       = require('should');
var settings     = require('./auth.json')['Customer.io'];
var convert      = require('convert-dates');
var time         = require('unix-time');

describe('Customer.io', function () {
  var cio;

  beforeEach(function(){
    cio = new integrations['Customer.io']();
  })

  describe('.enabled()', function () {
    it('should only be enabled for server side messages', function () {
      test(cio).server({ userId: 'id' }).should.be.true;
      test(cio).client({ userId: 'id' }).should.be.false;
      test(cio).mobile({ userId: 'id' }).should.be.false;
    });

    it('should only be enabled for messages with `userId`', function () {
      test(cio).server().should.be.false;
      test(cio).server({ userId: 'id' }).should.be.true;
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
    var payload;
    var track;

    beforeEach(function(){
      track = helpers.track();
    })

    beforeEach(function(){
      payload = {
        timestamp: time(track.timestamp()),
        data: convert(track.properties(), time),
        name: track.event()
      };
    })

    it('should format and send correctly', function (done) {
      test(cio)
        .set(settings)
        .track(track)
        .path('/api/v1/customers/' + track.userId() + '/events')
        .sends(payload)
        .expects(200, done);
    });

    it('should error on invalid set of keys', function(done){
      test(cio)
        .set({ apiKey: 'x', siteId: 'x' })
        .track(track)
        .error(done);
    })
  });

  describe('.identify()', function () {
    var identify;
    var payload;

    beforeEach(function(){
      identify = helpers.identify();
    })

    beforeEach(function(){
      payload = convert(identify.traits(), time);
      payload.created_at = time(identify.created());
      payload.email = identify.email();
      delete payload.created;
    })

    it('should format and send correctly', function (done) {
      test(cio)
        .set(settings)
        .identify(identify)
        .path('/api/v1/customers/' + identify.userId())
        .sends(payload)
        .expects(200, done);
    });

    it('will error on an invalid set of keys', function (done) {
      test(cio)
        .set({ apiKey: 'x', siteId: 'x' })
        .identify(helpers.identify())
        .error(done);
    });

    it('should identify with only an email as id', function(done){
      test(cio)
        .set(settings)
        .identify({ userId: 'test@segment.io' })
        .sends({ email: 'test@segment.io', id: 'test@segment.io' })
        .expects(200, done);
    })
  });


  describe('.group()', function(){
    it('should get a good response from the API', function(done){
      var group = helpers.group();
      cio.group(group, settings, done);
    })
  })

  describe('.visit()', function(){
    it('should not send the request if active is false', function(done){
      var track = helpers.track({ context: { active: false } });
      cio.visit(track, settings, function(){
        arguments.length.should.eql(0);
        done();
      });
    })

    it('should send the request if active is true', function(done){
      var track = helpers.track(); // true by default.
      cio.visit(track, settings, done);
    })
  })


  describe('.alias()', function () {
    it('should do nothing', function (done) {
      cio.alias({}, {}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});
