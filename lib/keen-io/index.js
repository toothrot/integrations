
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var BadRequest = integration.errors.BadRequest;
var fmt = require('util').format;
var mapper = require('./mapper');

/**
 * Expose `KeenIO`
 */

var KeenIO = module.exports = integration('Keen IO')
  .endpoint('https://api.keen.io/3.0')
  .ensure('settings.projectId')
  .ensure('settings.writeKey')
  .channels(['server'])
  .mapper(mapper)
  .retries(2);

/**
 * Track.
 *
 * https://keen.io/docs/api/reference/#event-resource
 * https://keen.io/docs/api/reference/#post-request-body-example-of-batch-event-posting
 *
 * @param {Track} track
 * @param {Function} fn
 * @api public
 */

KeenIO.prototype.track = function(payload, fn){
  return this
    .post(fmt('/projects/%s/events', this.settings.projectId))
    .query({ api_key: this.settings.writeKey })
    .type('json')
    .send(payload)
    .end(this.check(fn));
};

/**
 * Check respponse with `fn(err, res)`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Function}
 * @api private
 */

KeenIO.prototype.check = function(fn){
  var self = this;
  return this.handle(function(err, res){
    if (err) return fn(err);
    var event = Object.keys(res.body)[0];
    var results = res.body[event];
    var failures = 0;
    var error;
    var err;

    if (!results) {
      err = new BadRequest('Received a bad Keen IO response', 200, res.body);
      return fn(err);
    }

    results.forEach(function(result){
      if (result.success) return;
      if (!error) error = result.error;
      self.debug(result.error);
      failures++;
    });

    if (failures) {
      err = new BadRequest(error, 200, res.body);
      return fn(err);
    }

    fn(null, res);
  });
};
