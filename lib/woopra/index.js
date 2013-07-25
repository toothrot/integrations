
var debug       = require('debug')('Segmentio:Woopra')
  , crypto      = require('crypto')
  , extend      = require('extend')
  , Integration = require('../integration')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util');


module.exports = Woopra;


function Woopra () {
  this.name = 'Woopra';
  // TODO: add https setting.
  // For now, some Woopra accounts don't support https, so we use http
  this.baseUrl = 'http://www.woopra.com/track/ce/';
}


util.inherits(Woopra, Integration);


Woopra.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
};


Woopra.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'domain');
};


/**
 * Track a Woopra user
 * https://www.woopra.com/docs/setup/http-tracking-api/
 */

Woopra.prototype.track = function (track, settings, callback) {

  // TODO: remove backwards compat 'options.timeout'
  var payload = {
    host    : settings.domain,
    cookie  : md5(track.userId() || track.sessionId()),
    ip      : track.ip(),
    timeout : track.proxy('options.timeout') || settings.timeout
  };

  extend(payload, prefixKeys(track.properties(), 'ce_'));

  var req = {
    url : this.baseUrl,
    qs  : payload
  };

  debug('making track request');
  request.get(req, this._handleResponse(callback));
};


/**
 * Identify a Woopra user
 * https://www.woopra.com/docs/setup/http-tracking-api/
 */

Woopra.prototype.identify = function (identify, settings, callback) {

  var payload = prefixKeys(identify.traits(), 'cv_');

  // TODO: remove backwards compat 'options.timeout'
  extend(payload, {
    host       : settings.domain,
    cookie     : md5(identify.userId() || identify.sessionId()),
    ip         : identify.ip(),
    timeout    : identify.proxy('options.timeout') || settings.timeout,
    cv_name    : identify.name(),
    cv_company : identify.proxy('traits.company')
  });

  var req = {
    url : this.baseUrl,
    qs  : payload
  };

  debug('making identify request');
  request.get(req, this._handleResponse(callback));
};


/**
 * Return a copy of the object with all the keys properly prefixed by a string
 *
 * prefixKeys({ a : 'b' }, 'x_'); -> { x_a : 'b' }
 */

function prefixKeys (obj, prefix) {
  var result = {};
  Object.keys(obj).forEach(function (key) {
    result[prefix + key] = obj[key];
  });
  return result;
}


/**
 * Compute the md5 hex digest.
 */

function md5 (str) {
  return crypto.createHash('md5').update(str).digest('hex');
}
