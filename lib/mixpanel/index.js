
var errors   = require('../errors')
  , is       = require('is')
  , ms       = require('ms')
  , Provider = require('../provider')
  , request  = require('request-retry')({ retries : 2 })
  , util     = require('util');


module.exports = Mixpanel;


function Mixpanel () {
  this.name    = 'Mixpanel';
  this.baseUrl = 'https://api.mixpanel.com/';
}


util.inherits(Mixpanel, Provider);


Mixpanel.prototype.enabled = function (message, settings) {
  return message.channel() === 'server';
};


Mixpanel.prototype.validate = function (message, settings) {
  if (!is.string(settings.token) || is.empty(settings.token)) {
    return this._validationError('token');
  }

  if (shouldImport(message) &&
      (!is.string(settings.apiKey) || is.empty(settings.apiKey))) {
    return this._validationError('apiKey');
  }
};


Mixpanel.prototype.identify = function (message, settings, callback) {
  if (!settings.people || !message.userId()) return process.nextTick(callback);

  var options    = message.options()
    , timestamp  = message.timestamp() || new Date()
    , ignoreTime = false
    , traits     = formatTraits(message)
    , ip;

  if (options) {
    if (options[this.name]) ignoreTime = options[this.name]['ignoreTime'];
    if (options.ip) ip = options.ip;
  }

  var payload = {
    '$distinct_id' : message.userId() || message.sessionId(), // the primary id
    '$token'       : settings.token,
    '$time'        : timestamp.getTime(),
    '$set'         : traits,                 // set all the traits on identify
    '$ip'          : ip,                     // use the ip passed in options
    '$ignore_time' : ignoreTime,
    'mp_lib'       : 'Segment.io'
  };

  // Mixpanel uses a base64-encoded string appended to the querystring
  payload = new Buffer(JSON.stringify(payload)).toString('base64');

  var req = {
    url : this.baseUrl + 'engage/',
    qs  : {
      ip      : 0,       // pass a flag to ignore the server-ip
      verbose : 1,       // make sure that we get a valid response
      data    : payload
    }
  };

  request.get(req, this._parseResponse(callback));
};


Mixpanel.prototype.track = function (message, settings, callback) {
  var endpoint = shouldImport(message) ? 'track/' : 'import/';


  var payload = {
    event      : message.event(),
    properties : message.properties()
  };

  payload = new Buffer(JSON.stringify());

};


Mixpanel.prototype._parseResponse = function (callback) {
  return this._handleResponse(function (err, body) {
    if (err) return callback(err);

    try {
      body = JSON.parse(body);
      if (!body.status) err = new errors.BadRequest(body.error);
    } catch (e) {
      err = e;
    }
    return callback(err);
  });
};


Mixpanel.prototype.revenue = function (message, settings, callback) {


};


function formatTraits (message) {

  var traits = message.traits() || {};

  // https://mixpanel.com/help/reference/http#people-special-properties
  if (message.firstName()) traits['$first_name'] = message.firstName();
  if (message.lastName())  traits['$last_name']  = message.lastName();
  if (message.created())   traits['$created']    = formatDate(message.created());
  if (message.email())     traits['$email']      = message.email();
  if (message.phone())     traits['$phone']      = message.phone();

  return traits;
}


function formatProperties (message) {

  var properties = message.properties() || {}
    , timestamp  = message.timestamp() || new Date();

  properties['distinct_id'] = message.userId() || message.sessionId();
  properties['time']        = Math.floor(timestamp.getTime() / 1000); // to sec
  properties['mp_lib']      = 'Segment.io';

  return properties;
}


/**
 * Formats a date for Mixpanel's API
 * https://mixpanel.com/help/reference/http#dates-in-updates
 */

function formatDate (date) {
  return (new Date(date)).toISOString().slice(0,19);
}


/**
 * Mixpanel uses different endpoints for historical import.
 * https://mixpanel.com/docs/api-documentation/importing-events-older-than-31-days
 * @return {Boolean}
 */

function shouldImport (message) {
  var timestamp = message.timestamp() || new Date();
  return (Date.now() - timestamp.getTime()) > ms('5d');
}