
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Frontleaf`
 */

var Frontleaf = module.exports = integration('Frontleaf')
  .endpoint('https://api.frontleaf.com/api/track')
  .mapper(mapper)
  .retries(2);

/**
 * Enabled.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

Frontleaf.prototype.enabled = function(message){
  return !! (message.enabled(this.name)
    && 'server' == message.channel()
    && message.field('userId'));
};

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

Frontleaf.prototype.validate = function(message, settings){
  return this.ensure(settings.token, 'token')
    || this.ensure(settings.stream, 'stream');
};

/**
 * Identify.
 *
 * http://docs.frontleaf.com/#/api-reference/data-collection-api/identify
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Frontleaf.prototype.identify = request('/identify');


/**
 * Group.
 *
 * http://docs.frontleaf.com/#/api-reference/data-collection-api/identify
 *
 * @param {Group} group
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Frontleaf.prototype.group = request('/identify');

/**
 * Track.
 *
 * http://docs.frontleaf.com/#/api-reference/data-collection-api/event
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Frontleaf.prototype.track = request('/event');

/**
 * Generate request.
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
