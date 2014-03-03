
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Woopra`
 */

var Woopra = module.exports = integration('Woopra')
  .endpoint('http://www.woopra.com/track')
  .mapper(mapper)
  .retries(2);

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

Woopra.prototype.validate = function(_, settings){
  return this.ensure(settings.domain, 'domain');
};

/**
 * Identify.
 *
 * @param {Object} payload
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Woopra.prototype.identify = request('/identify/');

/**
 * Track.
 *
 * @param {Object} payload
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Woopra.prototype.track = request('/ce');

/**
 * Generate request.
 *
 * @param {String} path
 * @return {Function}
 * @api private
 */

function request(path){
  return function(payload, _, fn){
    var req = this.get(path);
    if (payload.lang) req.set('Accept-Language', payload.lang);
    if (payload.ua) req.set('User-Agent', payload.ua);
    delete payload.lang;
    delete payload.ua;
    req.query(payload);
    req.end(this.handle(fn));
  };
}
