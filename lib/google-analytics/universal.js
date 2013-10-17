var debug       = require('debug')('segmentio:integrations:google-analytics-universal')
  , hash        = require('string-hash')
  , Integration = require('segmentio-integration')
  , is          = require('is')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util');


module.exports = GAUniversal;


function GAUniversal () {
  this.name = 'Google Analytics';
  this.url  = 'https://ssl.google-analytics.com/collect';
}


util.inherits(GAUniversal, Integration);


GAUniversal.prototype.track = function (track, settings, callback) {

  var req = {
    url     : this.url,
    form    : this._createForm(track, settings),
    headers : this._headers(track, settings)
  };

  debug('making track request');
  request.post(req, this._handleResponse(callback));
};


/**
 * Adds the required parameters to the GA analytics request, per
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#event
 * @param  {Object} message
 * @param  {Object} settings
 * @return {Object} form
 */
GAUniversal.prototype._createForm = function (track, settings) {

  var cid        = hash(track.userId() || track.sessionId())
    , category   = track.proxy('properties.category') || 'All'
    , label      = track.proxy('properties.label')    || 'event'
    , value      = track.proxy('properties.value')    || track.revenue()
    , options    = track.options(this.name);

  // If they set the clientId explicitly in the context
  if (options) {
    var clientId = options.clientId;
    if (is.string(clientId)) cid = clientId;
  }

  var form = {
    v   : 1,
    tid : settings.serversideTrackingId,
    cid : cid,
    t   : 'event',
    ec  : category,
    ea  : track.event(),
    el  : label
  };

  if (value !== undefined) form.ev = Math.round(value);
  return form;
};


GAUniversal.prototype._headers = function (message, settings) {
  var userAgent = message.userAgent();

  if (userAgent) userAgent = userAgent.full;

  return {
    'User-Agent' : userAgent || 'not set'
  };
};
