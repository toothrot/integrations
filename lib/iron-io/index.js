
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

var Iron = module.exports = integration('Ironio')
  .endpoint('https://mq-aws-us-east-1.iron.io:443')
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
  return this.ensure(settings.projectId, 'projectId')|| this.ensure(settings.token, 'token');
};



Iron.prototype.track = function(payload, settings, fn){
  return this
  .post(fmt('/1/projects/%s/queues/%s/messages', settings.projectId, payload["event-type"]))
  .query({oauth: settings.token})
  .type('application/json')
  .send(payload['message'])
  .end(this.check(fn));
};
// *
//  * Check response with `fn(err, res)`.
//  *
//  * @param {String} event
//  * @param {Function} fn
//  * @return {Function}
//  * @api private


 Iron.prototype.check = function(fn){
  var self = this;
  return this.handle(function(err, res){
    if (err) return fn(err);
    var event = Object.keys(res.body)[0];
    var results = res.body[event];
    var failures = 0;
    var error;
    var err;

    if (!results) {
      err = new BadRequest('Received a bad Iron IO response', 200, res.body);
      return fn(err);
    }

    results.forEach(function(result){
      if (result.success) return;
      if (!error) error = result.err;
      self.debug(result.err);
    });

    if (failures) {
      err = new BadRequest(error, 200, res.body);
      return fn(err);
    }
    fn(null, res);
  });
};
