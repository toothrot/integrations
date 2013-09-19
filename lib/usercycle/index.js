
var debug       = require('debug')('Segmentio:USERcycle')
  , extend      = require('extend')
  , Integration = require('segmentio-integration')
  , isostring   = require('isostring')
  , objCase     = require('obj-case')
  , request     = require('request-retry')({ retries : 2 })
  , unixTime    = require('unix-time')
  , util        = require('util');

var errors = Integration.errors;

module.exports = USERcycle;

function USERcycle () {
  this.name    = 'USERcycle';
  this.baseUrl = 'https://api.usercycle.com/api/v1';
}

util.inherits(USERcycle, Integration);

USERcycle.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
};

USERcycle.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'apiKey');
};

USERcycle.prototype.identify = function (identify, settings, callback) {
  var properties = formatProperties(identify.traits() || {});

  objCase.del(properties, 'firstName');
  objCase.del(properties, 'lastName');
  objCase.del(properties, 'email');
  extend(properties, {
    first_name : identify.firstName(),
    last_name  : identify.lastName(),
    email      : identify.email()
  });

  var payload = {
    uid         : identify.userId() || identify.sessionId(),
    occurred_at : unixTime(identify.timestamp()),
    action_name : 'came_back',
    properties  : properties };

  var req = {
    url     : this.baseUrl + '/events.json',
    qs      : payload,
    headers : {'X-Usercycle-API-Key': settings.apiKey}
  };

  debug('making identify request');
  console.log(req);
  request.post(req, this._parseResponse(callback));
};

USERcycle.prototype.track = function (track, settings, callback) {
  var properties = formatProperties(track.traits() || {});

  objCase.del(properties, 'email');
  extend(properties, { email : track.email() });

  if (track.revenue()) properties['revenue_amount'] = track.revenue();

  var payload = {
    uid         : track.userId() || track.sessionId(),
    occurred_at : unixTime(track.timestamp()),
    action_name : track.event(),
    properties  : properties };

  var req = {
    url     : this.baseUrl + '/events.json',
    qs      : payload,
    headers : {'X-Usercycle-API-Key': settings.apiKey}
  };

  debug('making track request');
  request.post(req, this._parseResponse(callback));
};

USERcycle.prototype._parseResponse = function (callback) {
  return this._handleResponse(function (err, res) {
    if (!err) return callback(err);

    try {
      body = JSON.parse(err.body);
      err = new errors.BadRequest("Failed USERcycle request: " + body.error);
    } catch (e) {
      debug('failed to parse body: %s', body);
      err = e;
    }
    return callback(err);
  });
};

// Transforms null values, dates and arrays (but keeps objects the same)
function formatProperties (properties) {
  var output = {};
  Object.keys(properties).forEach(function (key) {
    var val = properties[key];
    if (val === null || val === undefined) return;

    if (isostring(val)) output[key] = unixTime(val);
    else if (val.toString() !== '[object Object]') output[key] = val.toString();
    else output[key] = val;
  });

  return output;
}
