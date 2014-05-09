
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `KISSmetrics`
 */

var KISSmetrics = module.exports = integration('KISSmetrics')
  .endpoint('https://trk.kissmetrics.com')
  .mapper(mapper)
  .retries(2);

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @api public
 */

KISSmetrics.prototype.validate = function(message, settings){
  return this.ensure(settings.apiKey, 'apiKey');
};

/**
 * Identify.
 *
 * http://support.kissmetrics.com/apis/specifications.html
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

KISSmetrics.prototype.identify = function (identify, _, fn) {
  var identify = request('/s').bind(this);
  var alias = request('/a').bind(this);
  identify(payload.identify, _, function (err) {
    if (err) return fn(err);
    if (!payload.alias) return fn();
    alias(payload.alias, _, fn);
  });
};

/**
 * Track.
 *
 * http://support.kissmetrics.com/advanced/importing-data
 * http://support.kissmetrics.com/apis/specifications.html
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

KISSmetrics.prototype.track = request('/e');

/**
 * Alias.
 *
 * http://support.kissmetrics.com/apis/specifications.html
 *
 * @param {Alias} alias
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

KISSmetrics.prototype.alias = request('/a');

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
      .get(path)
      .query(payload)
      .end(this.handle(fn));
  };
}
