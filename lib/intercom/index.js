
var debug    = require('debug')('Segmentio-Intercom')
  , is       = require('is')
  , errors   = require('../errors')
  , Provider = require('../provider')
  , request  = require('request-retry')({ retries : 2 })
  , util     = require('util');


module.exports = Intercom;


function Intercom () {
  Provider.call(this);
  this.name = 'Intercom';
  this.baseUrl = 'https://api.intercom.io/v1';
}


util.inherits(Intercom, Provider);


Intercom.prototype.enabled = function (message, settings) {
  return message.channel() === 'server';
};


Intercom.prototype.validate = function (message, settings) {
  return this._validateSetting(settings, 'apiKey') ||
         this._validateSetting(settings, 'appId');
};


Intercom.prototype.identify = function (message, settings, callback) {

  var traits = message.traits();

  var payload = {
    user_id         : message.userId(),
    email           : message.email(),
    name            : message.name(),
    last_seen_ip    : message.ip(),
    last_request_at : unixTime(message.timestamp()),
    custom_data     : traits
  };

  // Add company data
  if (traits.company)   payload.companies = [formatCompany(traits.company)];
  if (traits.companies) payload.companies = traits.companies.map(formatCompany);

  if (message.created()) payload.created_at = unixTime(message.created());

  var req = {
    url     : this.baseUrl + '/users',
    headers : headers(message, settings),
    json    : payload
  };

  debug('sending identify request');
  request.put(req, this._handleResponse(callback));
};


function headers (message, settings) {
  var auth = new Buffer(settings.appId + ':' + settings.apiKey)
              .toString('base64');

  var authHeader = 'Basic ' + auth;

  return {
    'Authorization' : authHeader,
    'User-Agent'    : 'Segment.io/0.1.0'
  };
}



function formatCompany (company) {
  if (company.created) company.created_at = unixTime(company.created);
  return company;
}


function unixTime (date) {
  return Math.floor(date.getTime() / 1000);
}