
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
  .channels(['server', 'mobile'])
  .ensure('settings.apiKey')
  .mapper(mapper)
  .retries(2);

/**
 * Track.
 *
 * @param {Track} track
 * @param {Function} fn
 * @api public
 */

Heap.prototype.track = function(payload, fn){
  return this
    .post('/track')
    .type('json')
    .send(payload)
    .end(this.handle(fn));
}
