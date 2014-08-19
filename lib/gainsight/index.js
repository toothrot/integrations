
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var BadRequest = integration.errors.BadRequest;

/**
 * Expose `Gainsight`
 */

var Gainsight = module.exports = integration('Gainsight')
  .endpoint('https://event.gainsight.com')
  .channel('server')
  .channel('mobile')
  .channel('client')
  .retries(3);

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

Gainsight.prototype.validate = function(message, settings){
  return this.ensure(settings.accessKey, 'accessKey')
};

/**
 * Methods
 */

Gainsight.prototype.identify = request;
Gainsight.prototype.track = request;
Gainsight.prototype.alias = request;
Gainsight.prototype.group = request;
Gainsight.prototype.screen = request;
Gainsight.prototype.page = request;

/**
 * Impl for all methods.
 *
 *
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

function request(facade, settings, fn){
  var json = facade.json();

  return this
    .post('/clickstream/segmentio/event')
    .set('accessKey', settings.accessKey)
    .type('json')
    .send(json)
    .end(this.check(fn));
};

/**
 * Check response with `fn(err, res)`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Function}
 * @api private
 */

Gainsight.prototype.check = function(fn){
  return this.handle(function(err, res){
    if (err) return fn(err);
    if (res.ok) return fn(null, res);

    var status = res.statusCode;
    var body = res.body;

    err = new BadRequest('Received a bad Gainsight response', status, body);
    fn(err, res);
  });
};

