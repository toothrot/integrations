
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var fmt = require('util').format;
var find = require('obj-case');

/**
 * Expose `Drip`
 */

var Drip = module.exports = integration('Drip')
  .endpoint('https://api.getdrip.com/v1')
  .retries(2);

/**
 * Enabled.
 *
 * Drip is enabled only on the serverside.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

Drip.prototype.enabled = function(msg, settings){
  return !! (msg.enabled(this.name)
    && 'server' == msg.channel()
    && msg.email
    && msg.email());
};

/**
 * Validate.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

Drip.prototype.validate = function(msg, settings){
  var err = this.ensure(settings.token, 'token')
    || this.ensure(settings.accountId, 'accountId');

  if ('identify' == msg.action()) {
    var campaignId = this.campaignId(msg, settings);
    err = err || this.ensure(campaignId, 'campaignId');
  }

  return err;
};

/**
 * Identify.
 *
 * https://www.getdrip.com/docs/rest-api#subscribers
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Drip.prototype.identify = function(identify, settings, fn){
  var campaignId = this.campaignId(identify, settings);
  var accountId = settings.accountId;
  var url = fmt('/%s/campaigns/%s/subscribers', accountId, campaignId);
  var subscriber = {};

  subscriber.email = identify.email();
  subscriber.utc_offset = 0;
  subscriber.double_optin = false;
  subscriber.starting_email_index = 0;
  subscriber.custom_fields = normalize(identify.traits());
  subscriber.reactivate_if_unsubscribed = false;

  this.debug('subscribe %j', subscriber);

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
      fn(new errors.BadRequest('Bad Drip request "' + msg + '".', status, body));
    });
};

/**
 * Track.
 *
 * https://www.getdrip.com/docs/rest-api#events
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Drip.prototype.track = function(track, settings, fn){
  var accountId = settings.accountId;
  var url = fmt('/%s/events', accountId);
  var event = {};
  if (track.revenue()) event.value = track.revenue();
  event.action = track.event();
  event.email = track.email();

  this.debug('event %s => %j', event.email, event);

  this
    .post(url)
    .auth(settings.token)
    .type('json')
    .send({ events: [event] })
    .end(this.handle(fn));
};

/**
 * Get campaignId from settings or options.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Mixed}
 * @api private
 */

Drip.prototype.campaignId = function(msg, settings){
  var opts = msg.options(this.name) || {};
  return settings.campaignId || find(opts, 'campaignId');
};

/**
 * Normalize the given `obj` keys.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function normalize(obj){
  var keys = Object.keys(obj);
  var ret = {};

  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i].trim().replace(/[^a-z0-9_]/gi, '_');
    ret[key] = obj[keys[i]];
  }

  return ret;
}