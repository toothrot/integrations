var debug       = require('debug')('segmentio:integrations:google-analytics-universal')
  , hash        = require('string-hash')
  , Integration = require('segmentio-integration')
  , is          = require('is')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util');

/**
 * Expose `GAUniversal`
 */

module.exports = GAUniversal;

/**
 * Initialize `GAUniversal`
 */

function GAUniversal () {
  this.name = 'Google Analytics';
  this.url  = 'https://ssl.google-analytics.com/collect';
}

/**
 * Inherit `Integration`
 */

util.inherits(GAUniversal, Integration);

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} callback
 */

GAUniversal.prototype.track = function (track, settings, callback) {
  var form = common(track, settings);
  form.ec = track.proxy('properties.category') || 'All';
  form.el = track.proxy('properties.label') || 'event';
  form.ev = Math.round(track.proxy('properties.value') || 0);
  form.ea = track.event();
  form.t = 'event';

  var req = {
    headers : this._headers(track, settings),
    url     : this.url,
    form    : form,
  };

  debug('making track request');
  request.post(req, this._handleResponse(callback));
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

GAUniversal.prototype.page = function(page, settings, fn){
  var form = common(page, settings);
  var parsed = parse(page.proxy('properties.url') || '');
  form.dh = parsed.hostname;
  form.dp = parsed.path;
  form.t = 'pageview';

  var req = {
    headers: this._headers(track, settings),
    url: this.url,
    form: form,
  };

  debug('making page request');
  request.post(req, this._handleResponse(callback));
};

/**
 * Get headers.
 *
 * @return {Object}
 */

GAUniversal.prototype._headers = function (message, settings) {
  var userAgent = message.userAgent();

  if (userAgent) userAgent = userAgent.full;

  return {
    'User-Agent' : userAgent || 'not set'
  };
};

/**
 * Create common ga form.
 *
 * @param {Object} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

function common(track, settings){
  var cid = hash(track.userId() || track.sessionId());
  var options = track.options(this.name);
  var tid = settings.serversideTrackingId;

  if (options && is.string(options.clientId)) {
    cid = options.clientId;
  }

  return {
    v: 1,
    cid: cid,
    tid: tid
  };
}
