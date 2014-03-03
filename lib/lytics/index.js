
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var fmt = require('util').format;

/**
 * Expose `Lytics`
 */

var Lytics = module.exports = integration('Lytics')
  .endpoint('https://c.lytics.io/c')
  .retries(2);

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api private
 */

Lytics.prototype.validate = function(message, settings){
  return this.ensure(settings.cid, 'cid')
    || this.ensure(settings.apiKey, 'apiKey');
};

/**
 * Methods
 */

Lytics.prototype.identify = request;
Lytics.prototype.track = request;
Lytics.prototype.alias = request;

/**
 * Request.
 *
 * http://admin.lytics.io/doc/#segmentio
 *
 * @param {Facade} message
 * @param {Object} settings
 * @param {Fucntion} fn
 */

function request(message, settings, fn){
  var json = message.json();
  json.options = json.options || json.context;
  delete json.context;
  delete json.projectId;
  return this
    .post(fmt('/%s/segmentio', settings.cid))
    .set('User-Agent', 'Segment.io/1.0.0')
    .query({ access_token: settings.apiKey })
    .type('json')
    .send(json)
    .end(this.handle(fn));
}
