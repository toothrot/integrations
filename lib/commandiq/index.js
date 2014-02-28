
var debug       = require('debug')('segmentio:integrations:commandiq')
  , Batch       = require('batch')
  , Integration = require('segmentio-integration')
  , is          = require('is')
  , querystring = require('querystring')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util');

module.exports = CommandIQ;

function CommandIQ () {
  this.name = 'CommandIQ';
  this.baseUrl = 'http://api.commandiq.com/api/';
  this.identifyUserUrl = this.baseUrl + 'identifyUser/segmentio';
  this.trackEventUrl = this.baseUrl + 'trackEvent/segmentio'
}

util.inherits(CommandIQ, Integration);

/**
 * Check whether the integration is enabled- only accept calls from the server channel
 */

CommandIQ.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments);
};

/**
 * Validate the settings for the project (in this case, the apiKey)
 */

CommandIQ.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'apiKey');
};

/**
 * Handles segment.io's identify method.
 * Note: Traits that are not part of the CommandIQ identifyUser method are instead passed to trackEvent.
 * https://commandiq.com/docs/api
 */

CommandIQ.prototype.identify = function (identify, settings, callback) {
  var userId = identify.userId() || identify.sessionId();
  var body = {
    key: settings.apiKey,
    user_id: userId,
    email: identify.email()
  };
  var specialTraits =  [
    'android_push_registration_id',
    'ios_push_device_token',
    'urbanairship_android_apid',
    'urbanairship_ios_device_token'
  ];
  specialTraits.forEach(function(trait) {
    var val = identify.proxy('traits.' + trait);
    if (val) body[trait] = val;
  });
  // A list of traits that will not be sent to CIQ.
  var ignored = [
    'created',
    'userAgent'
  ];
  var batch = new Batch();
  var traits = identify.traits();
  var self = this;

  Object.keys(traits).forEach(function(trait){
    var value = traits[trait];
    if (specialTraits.indexOf(trait) > -1) return;
    if (ignored.indexOf(trait) > -1) return;
    batch.push(function(done){
      self._trackRequest(userId, trait, value, settings, done);
    });
  });

  batch.push(function(done) {
    // Create the request.
    var req = {
      url: self.identifyUserUrl,
      form: body
    };
    debug('making identify request %j', req);
    request.post(req, self._handleResponse(done));
  });

  batch.end(callback);
};


/**
 * Handles segment.io's track method.
 * Note: Sends each property as an individual request to CommandIQ's trackEvent method.
 * https://commandiq.com/docs/api
 */

CommandIQ.prototype.track = function (track, settings, callback) {
  var userId = track.userId() || track.sessionId();
  var properties = track.properties();
  var delimiter = ': ';
  var event = track.event();

  var self = this;
  var batch = new Batch();
  Object.keys(properties).forEach(function(key) {
    var property = properties[key];
    batch.push(function(done){
      key = event + delimiter + key;
      self._trackRequest(userId, key, property, settings, done);
    });
  });
  batch.end(callback);
};

/**
 * Return whether a value is valid
 */

function valid(value) {
  if (value == null) return false;
  var type = typeof value;
  return type == 'string'
    || type == 'number'
    || type == 'boolean';
}

/**
 * Sends a single trackEvent request to CommandIQ.
 */
CommandIQ.prototype._trackRequest =
  function(userId, key, value, settings, callback){
  if (is.date(value)) value = value.toISOString();

  var body = {
    user_id: userId,
    key: settings.apiKey,
    event_key: key,
    event_value: value,
    event_type: type(value)
  };

  if (!body.event_type) return callback();

  var req = {
    url: this.trackEventUrl,
    form: body
  };

  debug('making trackEvent request %j', req);
  request.post(req, this._handleResponse(callback));
}

/**
 * Special CommandIQ type function
 */

function type(val){
  var type = typeof val;
  if (type === 'boolean') return 'bool';
  if (type === 'string') return 'str';
  if (type === 'number') {
    // If the number isn't an integer, send it as a string.
    if (val % 1 === 0) return 'int';
    else return 'str';
  }
}


