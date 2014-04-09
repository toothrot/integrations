
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var find = require('obj-case');

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
    event   : JSON.stringify(this._format(track))
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

Amplitude.prototype._format = function(track){
  var options = track.options(this.name);

  var properties = {
    user_id              : track.userId(),
    event_type           : track.event(),
    device_id            : track.proxy('context.device.id'),
    time                 : track.timestamp().getTime(),
    event_properties     : customProperties(track.properties()),
    user_properties      : track.traits(),
    client_sdk           : track.proxy('context.os.name'),
    app_version          : track.proxy('context.app.version'),
    client_os            : track.proxy('context.os.version'),
    device_type          : track.proxy('context.device.type'),
    device_carrier       : track.proxy('context.network.carrier'),
    country              : track.proxy('context.location.country'),
    language             : track.proxy('context.language'),
    revenue              : track.revenue(),
    location_lat         : track.proxy('context.location.latitude'),
    location_lng         : track.proxy('context.location.longitude'),
    ip                   : track.ip(),
    event_id             : find(options, 'event_id'),
    amplitude_event_type : find(options, 'event_type')
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
  find.del(properties, 'language');
  find.del(properties, 'revenue');
  find.del(properties, 'event_id');
  find.del(properties, 'amplitude_event_type');
  return properties;
}
