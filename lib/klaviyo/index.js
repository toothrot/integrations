var debug    = require('debug')('Segmentio-Klaviyo')
  , extend   = require('extend')
  , errors   = require('../errors')
  , Provider = require('../provider')
  , request  = require('retry-request')({ retries : 2 })
  , util     = require('util');


function Klaviyo () {
  this.name = 'Klaviyo';
  this.baseUrl = 'http://a.klaviyo.com/api';
}


Klaviyo.prototype.enabled = function (message, settings) {
  return message.channel() === 'server';
};


Klaviyo.prototype.validate = function (message, settings) {
  return this._validateSetting(settings, 'apiKey');
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
    properties : formatProperties(identify)
  };

  var req = {
    url : this.baseUrl + '/identify',
    qs  : {
      data : new Buffer(JSON.stringify(payload)).toString('base64')
    }
  };

  debug('making identify request...');
  request.post(req, this._parseResponse(callback));
};



/**
 * Add Klaviyo's special properties
 * https://www.klaviyo.com/docs#people-special
 */

function formatProperties (identify) {

  var properties = identify.properties();

  extend(properties, {
    '$id'           : identify.userId() || identify.sessionId(),
    '$email'        : identify.email(),
    '$first_name'   : identify.firstName(),
    '$last_name'    : identify.lastName(),
    '$phone_number' : identify.phone(),
    '$title'        : identify.proxy('title', 'traits'),
    '$organization' : identify.proxy('organization', 'traits')
  });

  return properties;
}