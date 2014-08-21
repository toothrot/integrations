
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
  .channels(['server', 'mobile', 'client'])
  .ensure('settings.accessKey')
  .retries(3);

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
 * @param {Facade} facade
 * @param {Function} fn
 * @api public
 */

function request(facade, fn){
  var json = facade.json();

  return this
    .post('/clickstream/segmentio/event')
    .set('accessKey', this.settings.accessKey)
    .type('json')
    .send(json)
    .end(this.check(fn));
};

/**
 * Check response with `fn(err, res)`.
 *
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

