
var Batch       = require('batch')
  , debug       = require('debug')('segmentio:integrations:intercom')
  , extend      = require('extend')
  , hash        = require('string-hash')
  , Integration = require('segmentio-integration')
  , is          = require('is')
  , isostring   = require('isostring')
  , objCase     = require('obj-case')
  , request     = require('request-retry')({ retries : 2 })
  , unixTime    = require('unix-time')
  , util        = require('util')
  , fmt         = util.format;


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

Intercom.prototype.track = function (track, settings, fn) {
  var props = track.properties();
  var payload = {};
  var self = this;

  payload.user = { user_id: track.userId() };
  payload.type = 'event.list';
  payload.data = [{
    created: unixTime(track.timestamp()),
    event_name: track.event(),
    metadata: track.properties()
  }];

  var req = {
    url: 'https://api.intercom.io/v2/users/events',
    headers: headers(track, settings),
    json: payload
  };

  debug('track', payload);
  request.post(req, this._handleResponse(function(err){
    if (err) return fn(err);
    self._logImpression(track, settings, fn);
  }));
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

  var traits = formatTraits(identify.traits());
  var active = identify.active();

  extend(traits, {
    user_id: identify.userId(),
    email: identify.email(),
    name: identify.name()
  });

  if (active) traits.last_request_at = unixTime(identify.timestamp());
  if (identify.created()) traits.created_at = unixTime(identify.created());

  // Add company data
  var company   = identify.proxy('traits.company');
  var companies = identify.proxy('traits.companies');

  if (company) companies = [company];
  if (companies) {
    if (Array.isArray(companies)) traits.companies = companies.map(formatCompany);
    else objCase.del(traits, 'companies'); // intercom 500s if this is the case
  }

  var req = {
    url     : this.baseUrl + '/users',
    headers : headers(identify, settings),
    json    : traits
  };

  debug('updating the user %o', req);
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
  if (endswith(key, ' at')) return key.substr(0, key.length - 3) + '_at';
  return key;
}


/**
 * Test whether a string ends with the suffix
 */

function endswith (str, suffix) {
  str = str.toLowerCase();
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

