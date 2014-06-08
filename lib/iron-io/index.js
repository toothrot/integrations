
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var fmt = require('util').format;
var mapper = require('./mapper');
var BadRequest = integration.errors.BadRequest;

/**
 * Expose `Iron IO`
 */

var Iron = module.exports = integration('Iron.io')
  .endpoint('https://mq-aws-us-east-1.iron.io:443')
  .channel('server')
  .channel('mobile')
  .channel('client')
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

Iron.prototype.validate = function(message, settings){
  return this.ensure(settings.projectId, 'projectId')
    || this.ensure(settings.token, 'token');
};

/**
 * Track.
 *
 * http://dev.iron.io/mq/reference/api/#add_messages_to_a_queue
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Iron.prototype.track = function(payload, settings, fn){
  var url = fmt('/1/projects/%s/queues/segment/messages', settings.projectId);
  return this
    .post(url)
    .query({ oauth: settings.token })
    .type('json')
    .send(payload)
    .end(this.check(fn));
};

/**
 * Check response with `fn(err, res)`.
 */

 Iron.prototype.check = function(fn){
  var self = this;
  return this.handle(function(err, res){
    if (err) return fn(err);
    if (res.ok) return fn(null, res);

    var status = res.status;
    var msg = 'Received a bad Iron IO response ' + status;
    err = new BadRequest(msg, status, res.body);
    return fn(err);
  });
};
