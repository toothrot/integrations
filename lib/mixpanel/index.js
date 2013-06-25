
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

  var req = {
    url : this.baseUrl + 'engage/',
    qs  : {
      ip      : 0,       // pass a flag to ignore the server-ip
      verbose : 1,       // make sure that we get a valid response
      data    : encode(payload)
    }
  };

  request.get(req, this._parseResponse(callback));
};


Mixpanel.prototype.track = function (message, settings, callback) {
  var imported = shouldImport(message)
    , endpoint = imported ? 'track/' : 'import/';

  var payload = {
    event      : message.event(),
    properties : formatProperties(message, settings)
  };

  var req = {
    url : this.baseUrl + endpoint,
    qs  : {
      ip      : 0,
      verbose : 1,
      data    : encode(payload),
    }
  };

  if (imported) req.qs.apiKey = settings.apiKey;

  var batch = new Batch()
    , self  = this;

  batch.push(function (done) { request.post(req, self._parseResponse(done)); });

  if (message.revenue()) {
    batch.push(function (done) { self.revenue(message, settings, done); });
  }

  request.get(req, this._parseResponse(callback));
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
  var req = {
    url  : this.baseUrl + 'engage/',
    data : {
      ip      : 0,
      data    : encode(formatRevenue(message, settings)),
      verbose : 1
    }
  };

  req.post
};


function formatTraits (message) {

  var traits = message.traits() || {};

  // https://mixpanel.com/help/reference/http#people-special-properties
  traits['$first_name'] = message.firstName();
  traits['$last_name']  = message.lastName();
  traits['$created']    = formatDate(message.created());
  traits['$email']      = message.email();
  traits['$phone']      = message.phone();

  return traits;
}


function formatProperties (message, settings) {

  var properties = message.properties() || {}
    , timestamp  = message.timestamp();

  properties['distinct_id'] = message.userId() || message.sessionId();
  properties['token']       = settings.token;
  properties['time']        = Math.floor(timestamp.getTime() / 1000); // to sec
  properties['mp_lib']      = 'Segment.io';
  properties['$referrer']   = message.referrer();
  properties['$username']   = message.username();
  properties['$mp_keyword'] = message.query();
  properties['$ip']         = message.ip();
  properties['mp_lib']      = 'Segment.io';

  return properties;
}


/**
 * Create a revenue track call
 * https://mixpanel.com/help/reference/http#tracking-revenue
 */

function formatRevenue (message, settings) {

  var properties = message.properties() || {}
    , timestamp  = message.timestamp();

  return {
    '$distinct_id' : message.userId() || message.sessionId(),
    '$token'       : settings.token,
    '$append' : {
      '$transactions' : {
        '$time'   : formatDate(timestamp),
        '$amount' : parseRevenue(message.revenue())
      }
    }
  };
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


function encode (payload) {
  return new Buffer(JSON.stringify(payload)).toString('base64');
}


function parseRevenue (revenue) {
  if (typeof revenue === 'number') return revenue;
  if (typeof revenue !== 'string') return 0;

  revenue = revenue.replace(/\$/g, '');
  return parseFloat(revenue);
}