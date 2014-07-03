
/**
 * Module dependencies.
 */

var title = require('to-title-case');
var find = require('obj-case');
var del = find.del;

/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track){
  var payload = common(track);
  payload.revenue = track.revenue();
  payload.event_type = track.event();
  payload.event_properties = properties(track.properties());
  return payload;
};

/**
 * Map `page`.
 *
 * @param {Page} page
 * @return {Object}
 * @api private
 */


exports.page = function(page){
  var payload = common(page);
  payload.event_type = page.event(page.fullName());
  payload.event_properties = properties(page.properties());
  return payload;
};

/**
 * Map `screen`.
 *
 * @param {Screen} screen
 * @return {Object}
 * @api private
 */

exports.screen = function(screen){
  var payload = common(screen);
  payload.event_type = screen.event(screen.fullName());
  payload.event_properties = properties(screen.properties());
  return payload;
};

/**
 * Format the amplitude specific properties.
 *
 * @param {Track} facade
 * @return {Object}
 */

function common(facade){
  var options = facade.options('Amplitude');
  return {
    user_id: facade.userId(),
    device_id: facade.proxy('context.device.id'),
    time: facade.timestamp().getTime(),
    user_properties: facade.traits(),
    client_sdk: facade.proxy('context.os.name'),
    app_version: facade.proxy('context.app.version'),
    client_os: facade.proxy('context.os.version'),
    device_type: device(facade),
    device_carrier: facade.proxy('context.network.carrier'),
    country: facade.proxy('context.location.country'),
    language: facade.proxy('context.language'),
    location_lat: facade.proxy('context.location.latitude'),
    location_lng: facade.proxy('context.location.longitude'),
    ip: facade.ip(),
    event_id: find(options, 'event_id'),
    amplitude_event_type: find(options, 'event_type')
  };
}

/**
 * Remove amplitude specific properties from facade properties.
 *
 * @param {Object} properties
 * @return {Object}
 */

function properties(properties){
  del(properties, 'language');
  del(properties, 'revenue');
  del(properties, 'event_id');
  del(properties, 'amplitude_event_type');
  return properties;
}

/**
 * Returns the name of the device for amplitude from the model and
 * manufacturer.
 *
 * @param {Facade} facade
 * @return {String}
 */

function device(facade){
  var model = facade.proxy('context.device.model') || '';
  var manufacturer = facade.proxy('context.device.manufacturer') || '';
  if (model && manufacturer) return title(manufacturer) + ' ' + model;
}