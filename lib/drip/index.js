
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var BadRequest = integration.errors.BadRequest;
var mapper = require('./mapper');
var fmt = require('util').format;
var find = require('obj-case');

/**
 * Expose `Drip`
 */

var Drip = module.exports = integration('Drip')
  .endpoint('https://api.getdrip.com/v1')
  .ensure('settings.campaignId', { methods: ['identify'] })
  .ensure('settings.accountId')
  .ensure('settings.token')
  .ensure('message.email')
  .channels(['server'])
  .retries(2);

/**
 * Identify.
 *
 * https://www.getdrip.com/docs/rest-api#subscribers
 *
 * @param {Identify} identify
 * @param {Function} fn
 * @api public
 */

Drip.prototype.identify = function(identify, fn){
  var settings = this.settings;
  var campaignId = this.campaignId(identify);
  var accountId = settings.accountId;
  var url = fmt('/%s/campaigns/%s/subscribers', accountId, campaignId);
  var subscriber = mapper.identify(identify);

  this
    .post(url)
    .auth(settings.token)
    .type('json')
    .send({ subscribers: [subscriber] })
    .end(function(err, res){
      if (err) return fn(err);
      if (res.ok) return fn(null, res);
      var errors = res.body.errors || [{}];
      var msg = errors[0].message;
      var status = res.status;
      var body = res.body;
      if ('Email is already subscribed' == msg) return fn(null, res);
      fn(new BadRequest('Bad Drip request "' + msg + '".', status, body));
    });
};

/**
 * Track.
 *
 * https://www.getdrip.com/docs/rest-api#events
 *
 * @param {Track} track
 * @param {Function} fn
 * @api public
 */

Drip.prototype.track = function(track, fn){
  var accountId = this.settings.accountId;
  var url = fmt('/%s/events', accountId);
  var event = mapper.track(track);

  this
    .post(url)
    .auth(this.settings.token)
    .type('json')
    .send({ events: [event] })
    .end(this.handle(fn));
};

/**
 * Get campaignId from settings or options.
 *
 * @param {Facade} msg
 * @return {Mixed}
 * @api private
 */

Drip.prototype.campaignId = function(msg){
  var opts = msg.options(this.name) || {};
  return this.settings.campaignId || find(opts, 'campaignId');
};

/**
 * Normalize the given `obj` keys.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

Drip.prototype.normalize = function(obj){
  var keys = Object.keys(obj);
  var ret = {};

  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i].trim().replace(/[^a-z0-9_]/gi, '_');
    ret[key] = obj[keys[i]];
  }

  return ret;
}
