
var Provider = require('../provider')
  , extend   = require('extend')
  , util     = require('util');



function KeenIO () {
  Provider.call(this);
  this.version = '3.0';
  this.baseUrl = 'https://api.keen.io/' + this.version;
}


util.inherits(KeenIO, Provider);



KeenIO.prototype.enabled = function (message, settings) {
  return message.channel() === 'server';
};


KeenIO.prototype.validate = function(message, settings) {
  return this._validateSetting(settings, 'projectId') ||
         this._validateSetting(settings, 'writeKey');
};


/**
 * Track an event using the Keen IO event api
 *
 * https://keen.io/docs/api/reference/#event-resource
 * https://keen.io/docs/api/reference/#post-request-body-example-of-batch-event-posting
 */
KeenIO.prototype.track = function (track, settings, callback) {

  var payload    = {}
    , event      = track.event()
    , properties = track.properties();

  extend(properties, {
    userId : track.userId() || track.sessionId(),
    keen   : {
      timestamp : track.timestamp()
    }
  });

  // TODO: add batching, since keen supports it
  payload[event] = [properties];

  var req = {
    url  : this.baseUrl + util.format('/projects/%s/events', settings.projectId),
    qs   : { api_key : settings.writeKey },
    json : payload
  };

  request.post(req, this._parseResponse(callback));
};
