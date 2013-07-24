
var debug       = require('debug')('Segmentio:Intercom')
  , errors      = require('../errors')
  , hash        = require('string-hash')
  , Integration = require('../integration')
  , is          = require('is')
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
         message.channel() === 'server';
};


Intercom.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'apiKey') ||
         this._missingSetting(settings, 'appId');
};


/**
 * Identify a user in intercom
 * http://docs.intercom.io/#CustomData
 * http://docs.intercom.io/api#creating_a_user
 */

Intercom.prototype.identify = function (identify, settings, callback) {

  var traits = identify.traits();

  var payload = {
    user_id         : identify.userId(),
    email           : identify.email(),
    name            : identify.name(),
    last_seen_ip    : identify.ip(),
    last_request_at : unixTime(identify.timestamp()),
    custom_data     : traits
  };

  if (identify.created()) payload.created_at = unixTime(identify.created());

  // Add company data
  var company   = identify.proxy('traits.company')
    , companies = identify.proxy('traits.companies');

  if (company) companies = [company];

  if (companies) payload.companies = companies.map(formatCompany);

  var userAgent = identify.userAgent();
  if (userAgent) payload.last_seen_user_agent = userAgent.full;

  var req = {
    url     : this.baseUrl + '/users',
    headers : headers(identify, settings),
    json    : payload
  };

  debug('sending identify request');
  request.put(req, this._handleResponse(callback));
};


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
  company.id = company.id || hash(company.name);
  return company;
}

