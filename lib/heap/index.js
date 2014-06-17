
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Heap`
 */

var Heap = module.exports = integration('Heap')
  .endpoint('https://heapanalytics.com/api')
  .mapper(mapper)
  .retries(2);

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api private
 */

Heap.prototype.validate = function(_, settings){
  return this.ensure(settings.app_id, 'app_id');
};

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Heap.prototype.track = request('/track');

/**
 * Request.
 *
 * @param {String} path
 * @return {Function}
 * @api private
 */

function request(path){
  return function(payload, settings, fn){
    return this
      .post(path)
      .type('json')
      .send(payload)
      .end(this.handle(fn));
  };
}
