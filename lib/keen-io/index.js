
var debug       = require('debug')('Segmentio:Keen IO')
  , extend      = require('extend')
  , Integration = require('segmentio-integration')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util');


var errors = Integration.errors;


module.exports = KeenIO;


function KeenIO () {
  this.name = 'Keen IO';
  this.version = '3.0';
  this.baseUrl = 'https://api.keen.io/' + this.version;
}


util.inherits(KeenIO, Integration);



KeenIO.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
};


KeenIO.prototype.validate = function(message, settings) {
  return this._missingSetting(settings, 'projectId') ||
         this._missingSetting(settings, 'writeKey');
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

  request.post(req, this._parseResponse(event, callback));
};


/**
 * Keen responses will come back with a 200 in the following form
 *
 * {
 *   'Event Name' : [{
 *     success : Boolean,
 *     err : String
 *   }]
 * }
 *
 * https://keen.io/docs/api/reference/#example-post-response
 *
 * @param  {String}   event     the name of the event
 * @param  {Function} callback  the callback
 * @return {[type]}
 */
KeenIO.prototype._parseResponse = function (event, callback) {

  return this._handleResponse(function (err, body) {
    if (err) return callback(err);

    var results = body[event];

    if (!results) {
      err = new errors.BadRequest('Received a bad Keen IO response', 200, body);
      return callback(err);
    }

    var failures = results.filter(function (result) { return !result.success; });
    failures.forEach(function (failure) { debug(failure.err); });

    if (failures.length > 0) {
      err = new errors.BadRequest(failures[0].err, 200, body);
    }

    return callback(err);
  });
};
