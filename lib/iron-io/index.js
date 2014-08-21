
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
  .channels(['server', 'mobile', 'client'])
  .ensure('settings.projectId')
  .ensure('settings.token')
  .mapper(mapper)
  .retries(2);

/**
 * Add methods.
 *
 * TODO: batch send
 */

Iron.prototype.identify = sendRequest;
Iron.prototype.screen = sendRequest;
Iron.prototype.alias = sendRequest;
Iron.prototype.track = sendRequest;
Iron.prototype.page = sendRequest;

/**
 * Send request with `payload`, `settings`, `fn`.
 *
 * @param {Facade} payload
 * @param {Function} fn
 * @api public
 */

function sendRequest(payload, fn){
  var url = fmt('/1/projects/%s/queues/segment/messages', this.settings.projectId);
  return this
    .post(url)
    .query({ oauth: this.settings.token })
    .type('json')
    .send(payload)
    .end(this.check(fn));
}

/**
 * Check response with `fn(err, res)`.
 */

 Iron.prototype.check = function(fn){
  return this.handle(function(err, res){
    if (err) return fn(err);
    if (res.ok) return fn(null, res);

    var status = res.status;
    var msg = 'Received a bad Iron IO response ' + status;
    err = new BadRequest(msg, status, res.body);
    return fn(err);
  });
};
