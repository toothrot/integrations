
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Vero`
 */

var Vero = module.exports = integration('Vero')
  .endpoint('https://api.getvero.com/api/v2')
  .mapper(mapper)
  .retries(2);

/**
 * Enabled.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

Vero.prototype.enabled = function(msg, settings){
  return !! (msg.enabled(this.name)
    && msg.userId
    && msg.userId());
};

/**
 * Validate.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

Vero.prototype.validate = function(msg, settings){
  return this.ensure(settings.authToken, 'authToken');
};

/**
 * Identify.
 *
 * https://github.com/getvero/vero-api/blob/master/sections/api/users.md
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Vero.prototype.identify = request('/users/track');

/**
 * Track.
 *
 * https://github.com/getvero/vero-api/blob/master/sections/api/events.md
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Vero.prototype.track = request('/events/track');

/**
 * Request.
 *
 * @param {String} path
 * @return {Function}
 * @api private
 */

function request(path){
  return function(payload, _, fn){
    return this
      .post(path)
      .type('json')
      .send(payload)
      .end(this.handle(fn));
  };
}
