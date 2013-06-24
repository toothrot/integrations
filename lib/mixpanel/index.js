
var errors   = require('../errors')
  , is       = require('is')
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
};


Mixpanel.prototype.identify = function (message, settings, callback) {
  if (!settings.people || !message.userId()) return process.nextTick(callback);

  var options    = message.options()
    , timestamp  = message.timestamp() || new Date()
    , ignoreTime = false
    , traits     = formatTraits(message)
    , ip;

  if (options) {
    if (options[this.name]) ignoreTime = options[this.name]['ignore_time'];
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
  payload = new Buffer(JSON.stringify([payload])).toString('base64');

  var req = {
    url : this.baseUrl + 'engage',
    qs  : {
      ip      : 0,       // pass a flag to ignore the server-ip
      data    : payload,
      verbose : 1
    }
  };

  request.get(req, this._parseResponse(callback));
};


Mixpanel.prototype.track = function (message, settings, callback) {
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


function formatTraits(message) {

  var traits = message.traits() || {};

  // https://mixpanel.com/help/reference/http#people-special-properties
  if (message.firstName()) traits['$first_name'] = message.firstName();
  if (message.lastName())  traits['$last_name']  = message.lastName();
  if (message.created())   traits['$created']    = formatDate(message.created());
  if (message.email())     traits['$email']      = message.email();
  if (message.phone())     traits['$phone']      = message.phone();

  return traits;
}


function formatDate(date) {
  return (new Date(date)).toISOString().slice(0,19);
}