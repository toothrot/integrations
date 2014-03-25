
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var ValidationError = integration.errors.Validation;
var find = require('obj-case');

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
  .retries(2);

/**
 * Enabled.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

ChurnBee.prototype.enabled = function(msg, settings){
  return !! (msg.enabled(this.name)
    && 'client' != msg.channel()
    && msg.userId // TODO: all msgs should have userId
    && msg.userId());
};

/**
 * Validate.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Facade}
 * @api public
 */

ChurnBee.prototype.validate = function(msg, settings){
  var err = this.ensure(settings.apiKey, 'apiKey');
  var event = this.event(msg, settings);
  if (err) return err;
  if (event) return;
  return new ValidationError('churnbee requires specific events, got: "' + event + '"');
};

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

ChurnBee.prototype.track = function(msg, settings, fn){
  var event = this.event(msg, settings);
  var time = msg.timestamp().toISOString();
  var apiKey = settings.apiKey;
  var id = msg.userId();
  var path = '/user/';

  try {
    path += encodeURIComponent(id) + '/';
  } catch (e) {
    return fn(e);
  }

  var query = clean({
    reason: msg.proxy('properties.description'),
    plan: msg.proxy('properties.plan'),
    custom: msg.properties(),
    amount: msg.revenue(),
    dateTime: time
  });

  if ('register' != event) path += event;

  return this
    .get(path)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Content-Length', 0)
    .query('accessToken=' + apiKey)
    .query(query)
    .end(function(err, res){
      if (err) return fn(err);
      if (ok(res)) return fn(null, res);
      fn(res.error);
    });
};

/**
 * Get event with `msg` and `settings`.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {String|null}
 * @api private
 */

ChurnBee.prototype.event = function(msg, settings){
  var events = settings.events || {};
  var event = find(events, msg.event()) || msg.event();
  if (supported.hasOwnProperty(event)) return event;
};

/**
 * Clean `nulls`.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function clean(obj){
  var ret = {};

  for (var k in obj) {
    if (null == obj[k]) continue;
    ret[k] = obj[k];
  }

  return ret;
}

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



