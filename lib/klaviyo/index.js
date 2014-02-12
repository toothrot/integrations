
var debug       = require('debug')('segmentio:integrations:klaviyo')
  , extend      = require('extend')
  , Integration = require('segmentio-integration')
  , request     = require('request-retry')({ retries : 2 })
  , unixTime    = require('unix-time')
  , util        = require('util')
  , validQs     = require('valid-querystring');


var errors = Integration.errors;


module.exports = Klaviyo;


function Klaviyo () {
  this.name = 'Klaviyo';
  this.baseUrl = 'http://a.klaviyo.com/api';
}


util.inherits(Klaviyo, Integration);


Klaviyo.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
};


Klaviyo.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'apiKey');
};


/**
 * Common function for parsing the response from a klaviyo call. Klaviyo
 * returns 1 on success, 0 on failure.
 */

Klaviyo.prototype._parseResponse = function (callback) {
  return this._handleResponse(function (err, body) {
    if (err) return callback(err);
    if (body !== '1') err = new errors.BadRequest('Bad Klaviyo Response');
    return callback(err);
  });
};


/**
 * Identify a user
 * https://www.klaviyo.com/docs
 */

Klaviyo.prototype.identify = function (identify, settings, callback) {

  var payload = {
    token      : settings.apiKey,
    properties : formatTraits(identify)
  };

  var req = {
    url : this.baseUrl + '/identify',
    qs  : { data : new Buffer(JSON.stringify(payload)).toString('base64') }
  };
  if (!validQs(req.qs)) return callback(new Error('Invalid querystring'));
  debug('making identify request...');
  request.get(req, this._parseResponse(callback));
};


/**
 * Submit track request
 * https://www.klaviyo.com/docs
 */

Klaviyo.prototype.track = function (track, settings, callback) {

  var payload = {
    token               : settings.apiKey,
    event               : track.event(),
    properties          : formatProperties(track),
    time                : unixTime(track.timestamp()),
    customer_properties : {
      $id    : track.userId() || track.sessionId(),
      $email : track.email()
    }
  };

  var req = {
    url : this.baseUrl + '/track',
    qs  : { data : new Buffer(JSON.stringify(payload)).toString('base64') }
  };
  if (!validQs(req.qs)) return callback(new Error('Invalid querystring'));
  debug('making track request...');
  request.get(req, this._parseResponse(callback));
};


/**
 * Add Klavioy's special properties, apparently undocumented :(
 */

function formatProperties(track) {

  var properties = track.properties();

  extend(properties, {
    $value : track.revenue()
  });

  return properties;
}


/**
 * Add Klaviyo's special traits
 * https://www.klaviyo.com/docs#people-special
 */

function formatTraits (identify) {

  var traits = identify.traits();

  extend(traits, {
    $id           : identify.userId() || identify.sessionId(),
    $email        : identify.email(),
    $first_name   : identify.firstName(),
    $last_name    : identify.lastName(),
    $phone_number : identify.phone(),
    $title        : identify.proxy('traits.title'),
    $organization : identify.proxy('traits.organization'),
    $company      : identify.proxy('traits.company')
  });

  return traits;
}
