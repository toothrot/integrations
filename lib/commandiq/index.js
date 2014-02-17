
var debug       = require('debug')('segmentio:integrations:commandiq')
  , Integration = require('segmentio-integration')
  , request     = require('request-retry')({ retries : 2 })
  , util 		    = require('util')
  , querystring = require('querystring')
  , Batch       = require('batch');

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
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
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
    var user_id = identify.userId() || identify.sessionId();
  // Store the post data that will be sent to CIQ identifyUser.
  var identifyUserPostData = {
    key: settings.apiKey,
    user_id: user_id
  };
  // List traits that, if found, will be sent as part of identifyUser post request.
  var identifyUserParams =  [
    'email',
    'android_push_registration_id',
    'ios_push_device_token',
    'urbanairship_android_apid',
    'urbanairship_ios_device_token'
  ];
  // A list of traits that will not be sent to CIQ.
  var ignoredTraits = [
    'created',
    'userAgent'
  ];
  // Data that will be sent as a trackEvent request, but is part of segment.io's identify object.
  var trackEventData = [];
  // Loop through traits, putting properties in the correct array.
  var traits = identify.traits();
  Object.keys(traits).forEach(function(t) {
    if (identifyUserParams.indexOf(t) > -1 && validParam(traits[t]))
    {
      // Send trait as identifyUser param
      identifyUserPostData[t] = traits[t];
    }
    else if (ignoredTraits.indexOf(t) == -1 && validParam(traits[t]))
    {
      // Save trait as [key, value] to be sent as a trackEvent param.
      trackEventData.push([t, traits[t]]);
    }
  });
  // Create the request.
  var req = {
    url: this.identifyUserUrl,
    body: querystring.stringify(identifyUserPostData),
    headers: getHeaders()
  };

  var batch = new Batch()
    , that = this;

  batch.push(function(done) {
    debug('Making identifyUser request');
    request.post(req, that._handleResponse(done));
  });
  trackEventData.forEach(function(e) {
    batch.push(function(done) {
      // Event is an array of [key, value]
      trackRequest(user_id, e[0], e[1], that, settings, done);
    })
  })
  batch.end(callback);
};


/**
 * Handles segment.io's track method.
 * Note: Sends each property as an individual request to CommandIQ's trackEvent method.
 * https://commandiq.com/docs/api
 */

CommandIQ.prototype.track = function (track, settings, callback) {
  var user_id = track.userId() || track.sessionId()
    , properties = track.properties()
    , trackEventData = [];
  var delimiter = '---';
  var eventName = (track.event != null && track.event().length > 0) ? track.event() + delimiter : '';
  Object.keys(properties).forEach(function(p) {
   if (validParam(properties[p]))
    {
      // Save trait as [key, value] to be sent as a trackEvent param.
      trackEventData.push([eventName + p, properties[p]]);
    }
  });

  var batch = new Batch()
    , that = this;
  trackEventData.forEach(function(e) {
    batch.push(function(done) {
      // Event is an array of [key, value]
      trackRequest(user_id, e[0], e[1], that, settings, done);
    })
  })
  batch.end(callback);
};

function getHeaders(settings) {
  return {'content-type' : 'application/x-www-form-urlencoded'};
}

function validParam(data) {
  return (data != null && (typeof data == 'string' || typeof data == 'number' || typeof data == 'boolean'))
}

/**
 * Sends a single trackEvent request to CommandIQ.
 */
CommandIQ.prototype._trackRequest = function(userId, key, value, settings, callback){
  var body = {
    user_id: userId,
    key: settings.apiKey,
    event_key: key,
    event_value: value,
    event_type: type(value)
  };





  var req = {
    url: context.trackEventUrl,
    body: querystring.stringify(postData),
    headers: getHeaders()
  };

  debug('Making trackEvent request');
  request.post(req, context._handleResponse(callback));
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

      callback(new Error('Invalid type for trackEvent data: ' + typeof value));
      break;
  }

}


