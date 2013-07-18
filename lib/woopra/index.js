var crypto   = require('crypto')
  , extend   = require('extend')
  , Provider = require('../provider')
  , request  = require('request-retry')({ retries : 2 })
  , util     = require('util');


module.exports = Woopra;


function Woopra () {
  Provider.call(this);
  this.name = 'Woopra';
  // Some Woopra accounts don't support https
  this.baseUrl = 'http://www.woopra.com/track/ce/';
}


util.inherits(Woopra, Provider);


Woopra.prototype.enabled = function (message, settings) {
  return message.channel() === 'server';
};


Woopra.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'domain');
};


/**
 * Track a Woopra user
 * https://www.woopra.com/docs/setup/http-tracking-api/
 */

Woopra.prototype.track = function (track, settings, callback) {

  var payload = {
    host    : settings.domain,
    cookie  : md5(track.userId() || track.sessionId()),
    ip      : track.ip(),
    timeout : track.proxy('options.timeout')
  };

  extend(payload, prefixKeys(track.properties(), 'ce_'));

  var req = {
    url : this.baseUrl,
    qs  : payload
  };

  request.get(req, this._handleResponse(callback));
};


/**
 * Identify a Woopra user
 * https://www.woopra.com/docs/setup/http-tracking-api/
 */

Woopra.prototype.identify = function (identify, settings, callback) {

  var payload = prefixKeys(identify.traits(), 'cv_');

  extend(payload, {
    host       : settings.domain,
    cookie     : md5(identify.userId() || identify.sessionId()),
    ip         : identify.ip(),
    timeout    : identify.proxy('options.timeout'),
    cv_name    : identify.name(),
    cv_company : identify.proxy('traits.company')
  });

  var req = {
    url : this.baseUrl,
    qs  : payload
  };

  request.get(req, this._handleResponse(callback));
};


/**
 * Return a copy of the object with all the keys properly prefixed by a string
 *
 * prefixKeys({ a : 'b' }, 'x_'); -> { x_a : 'b' }
 */

function prefixKeys (obj, prefix) {
  var result = {};
  for (var key in obj) {
    result[prefix + key] = obj[key];
  }
  return result;
}


/**
 * Compute the md5 hex digest.
 */

function md5 (str) {
  return crypto.createHash('md5').update(str).digest('hex');
}
