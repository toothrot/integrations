
var Batch       = require('batch')
  , debug       = require('debug')('segmentio:integrations:intercom')
  , extend      = require('extend')
  , hash        = require('string-hash')
  , Integration = require('segmentio-integration')
  , is          = require('is')
  , isostring   = require('isostring')
  , request     = require('request-retry')({ retries : 2 })
  , unixTime    = require('unix-time')
  , util        = require('util');


module.exports = Intercom;


function Intercom () {
  this.name = 'Intercom';
  this.baseUrl = 'https://api.intercom.io/v1';
}


util.inherits(Intercom, Integration);


Intercom.prototype.enabled = function (message, settings) {
  return Integration.enabled.call(this, message) &&
         message.channel() === 'server' &&
         message.userId &&
         message.userId() !== undefined;
};


Intercom.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'apiKey') ||
         this._missingSetting(settings, 'appId');
};


/**
 * Identify a user in intercom
 */

Intercom.prototype.identify = function (identify, settings, callback) {
  var self = this;

  this._updateUser(identify, settings, function (err) {
    if (err) return callback(err);
    if (!identify.active()) return callback();

    self._logImpression(identify, settings, callback);
  });
};


/**
 * Track the user's action
 */

Intercom.prototype.track = function (track, settings, callback) {
  this._logImpression(track, settings, callback);
};


/**
 * Create an intercom impression:
 * http://docs.intercom.io/api#creating_an_impression
 */

Intercom.prototype._logImpression = function (message, settings, callback) {

  var payload = {
    user_id: message.userId(),
    email:   message.email(),
  };

  if (message.ip()) payload.user_ip = message.ip();

  var ua = message.userAgent();
  if (ua) payload.user_agent = ua.full;

  var req = {
    url: this.baseUrl + '/users/impressions',
    headers: headers(message, settings),
    json: payload
  };

  debug('creating an impression', payload);
  request.post(req, this._handleResponse(callback));
};


/**
 * Update a user with custom data
 * http://docs.intercom.io/#CustomData
 * http://docs.intercom.io/api#creating_a_user
 */

Intercom.prototype._updateUser = function (identify, settings, callback) {

  var traits = formatTraits(identify.traits())
    , active = identify.active();

  var payload = {
    user_id         : identify.userId(),
    email           : identify.email(),
    name            : identify.name(),
    custom_data     : traits
  };

  if (active) {
    payload.last_request_at = unixTime(identify.timestamp());
  }

  if (identify.created()) payload.created_at = unixTime(identify.created());

  // Add company data
  var company   = identify.proxy('traits.company')
    , companies = identify.proxy('traits.companies');

  if (company) companies = [company];
  if (companies) payload.companies = companies.map(formatCompany);

  var req = {
    url     : this.baseUrl + '/users',
    headers : headers(identify, settings),
    json    : payload
  };

  debug('updating the user', payload);
  request.put(req, this._handleResponse(callback));
};


/**
 * Format all the traits which are dates for intercoms format
 */

function formatTraits (traits) {
  var output = {};

  Object.keys(traits).forEach(function (key) {
    var val = traits[key];
    if (isostring(val) || is.date(val)) {
      val = unixTime(val);
      key = dateKey(key);
    }

    output[key] = val;
  });

  return output;
}


/**
 * Set up a key with the dates for intercom
 * http://docs.intercom.io/#CustomDataDates
 */

function dateKey (key) {
  if (endswith(key, '_at')) return key;
  if (endswith(key, 'At')) key = key.substr(key.length - 2);
  return key + '_at';
}


/**
 * Test whether a string ends with the suffix
 */

function endswith (str, suffix) {
  return str.substr(str.length - suffix.length) === suffix;
}


/**
 * Add headers
 */

function headers (message, settings) {
  var auth = new Buffer(settings.appId + ':' + settings.apiKey)
              .toString('base64');

  var authHeader = 'Basic ' + auth;

  return {
    'Authorization' : authHeader,
    'User-Agent'    : 'Segment.io/1.0.0'
  };
}


/**
 * Formats a company for use with intercom
 * http://docs.intercom.io/#Companies
 */

function formatCompany (company) {
  if (is.string(company)) company = { name : company };
  if (company.created) company.created_at = unixTime(company.created);
  if (!company.id && !company.name) return company;
  company.id = company.id || hash(company.name);
  return company;
}

