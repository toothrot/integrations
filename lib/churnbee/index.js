
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var ValidationError = integration.errors.Validation;
var mapper = require('./mapper');
var find = require('obj-case');
var Batch = require('batch');

/**
 * Supported events
 */

var supported = {
  activation: true,
  changePlan: true,
  register: true,
  refund: true,
  charge: true,
  cancel: true,
  login: true,
};

/**
 * Expose `ChurnBee`
 */

var ChurnBee = module.exports = integration('ChurnBee')
  .endpoint('http://api.churnbee.com/v1')
  .channels(['server', 'mobile'])
  .ensure('settings.apiKey')
  .ensure('message.userId')
  .retries(2);

/**
 * Track.
 *
 * https://churnbee.com/docs/api
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

ChurnBee.prototype.track = function(msg, fn){
  var settings = this.settings;
  var events = this.map(settings.events, msg.event());
  var apiKey = settings.apiKey;
  var batch = new Batch;
  var id = msg.userId();
  var path = '/user/';
  var self = this;

  // encode path
  try {
    path += encodeURIComponent(id) + '/';
  } catch (e) {
    return fn(e);
  }

  // a user might send supported event
  // directly
  if (!events.length) events = [msg.event()];

  // remove unsupported events
  events = events.filter(function(event){
    return supported[event];
  });

  // map
  var payload = mapper.track(msg);

  // send
  events.forEach(function(event){
    batch.push(function(done){
      var endpoint = 'register' != event
        ? path + event
        : path;

      self
        .get(endpoint)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Content-Length', 0)
        .query('accessToken=' + apiKey)
        .query(payload)
        .end(function(err, res){
          if (err) return done(err);
          if (ok(res)) return done(null, res);
          done(res.error);
        });
    });
  });

  batch.end(function(err, responses){
    if (err) return fn(err);
    var res = responses[0] || {}; // in case of len(events) == 0
    res.all = responses;
    fn(null, res);
  });
};

/**
 * Check if the given `res` is ok.
 *
 * We check for `res.text` because `churnbee` api
 * returns incorrect json when `dateTime=` is sent.
 *
 *   - "user already registered" - `true`
 *   - others - `false`
 *
 * @param {Response} res
 * @return {Boolean}
 * @api public
 */

function ok(res){
  var msg = res.text || '';
  if (res.ok) return true;
  return /already registered/i.test(msg);
}
