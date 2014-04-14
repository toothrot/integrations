
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var hash = require('string-hash');
var parse = require('url').parse;
var is = require('is');

/**
 * Expose `GA`
 */

var GA = module.exports = integration('Google Analytics')
  .endpoint('https://ssl.google-analytics.com/collect')
  .retries(2);

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} callback
 */

GA.prototype.track = function (track, settings, callback) {
  return this
    .post()
    .type('form')
    .send(this._common(track, settings))
    .send({ ec: track.proxy('properties.category') || 'All' })
    .send({ el: track.proxy('properties.label') || 'event' })
    .send({ ev: Math.round(track.proxy('properties.value') || 0) })
    .send({ ea: track.event() })
    .send({ t: 'event' })
    .end(this.handle(callback));
};

/**
 * Page.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#page
 *
 * @param {Page} page
 * @param {Object} settings
 * @param {Function} fn
 */

GA.prototype.page = function(page, settings, fn){
  var parsed = parse(page.proxy('properties.url') || '');
  return this
    .post()
    .type('form')
    .send(this._common(page, settings))
    .send({ dh: parsed.hostname })
    .send({ dp: parsed.path })
    .send({ t: 'pageview' })
    .end(this.handle(fn));
};

/**
 * Get headers.
 *
 * @return {Object}
 */

GA.prototype._headers = function (message, settings) {
  var userAgent = message.userAgent();
  return {
    'User-Agent' : userAgent || 'not set'
  };
};

/**
 * Create common ga form.
 * 
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#using-a-proxy-server
 *
 * @param {Object} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

GA.prototype._common = function(track, settings){
  var cid = hash(track.userId() || track.sessionId());
  var options = track.options(this.name);
  var tid = settings.serversideTrackingId;

  if (options && is.string(options.clientId)) {
    cid = options.clientId;
  }

  return {
    v: 1,
    cid: cid,
    tid: tid,
    uip: track.ip(),
    ua: track.userAgent()
  };
}
