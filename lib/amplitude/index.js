
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var objcase = require('obj-case');

/**
 * Expose `Amplitude`
 */

var Amplitude = module.exports = integration('Amplitude')
  .endpoint('https://api.amplitude.com/httpapi')
  .retries(2);

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

Amplitude.prototype.validate = function (message, settings) {
  return this.ensure(settings.apiKey, 'apiKey');
};

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Amplitude.prototype.track = function (track, settings, callback) {
  var query = {
    api_key : settings.apiKey,
    event   : JSON.stringify(formatProperties(track))
  };

  return this
    .post()
    .type('json')
    .query(query)
    .end(this.handle(callback));
};

/**
 * Format the amplitude specific properties.
 *
 * @param {Track} track
 * @return {Object}
 */

function formatProperties (track) {
  var properties = {
    user_id              : track.username(),
    event_type           : track.event(),
    device_id            : track.proxy('context.device.id'),
    time                 : track.timestamp().getTime(),
    event_properties     : customProperties(track.properties()),
    client_sdk           : track.proxy('context.os.name'),
    app_version          : track.proxy('context.app.version'),
    client_os            : track.proxy('context.os.version'),
    device_type          : track.proxy('context.device.type'),
    device_carrier       : track.proxy('context.network.carrier'),
    country              : track.proxy('context.location.country'),
    language             : track.proxy('language'),
    revenue              : track.proxy('revenue'),
    location_lat         : track.proxy('context.location.latitude'),
    location_lng         : track.proxy('context.location.longitude'),
    ip                   : track.ip(),
    event_id             : track.proxy('event_id'),
    // doesn't work yet
    // session_id           : track.sessionId(),
    amplitude_event_type : track.proxy('amplitude_event_type')
  };

  return properties;
}

/**
 * Remove amplitude specific properties from track properties.
 *
 * @param {Object} properties
 * @return {Object}
 */

function customProperties (properties) {
  objcase.del(properties, 'language');
  objcase.del(properties, 'revenue');
  objcase.del(properties, 'event_id');
  objcase.del(properties, 'amplitude_event_type');
  return properties;
}
