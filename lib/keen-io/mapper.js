
/**
 * Module dependencies.
 */

var extend = require('extend');

/**
 * Map `track`.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

exports.track = function(track, settings){
  var props = track.properties();
  var options = track.options(this.name);
  var globals = options.traits || {};
  var ret = {};

  extend(props, {
    userId: track.userId() || track.sessionId(),
    ip_address: track.ip(),
    user_agent: track.userAgent(),
    page_url: track.proxy('properties.url'),
    keen: {
      timestamp: track.timestamp(),
      addons: addons(settings)
    }
  });

  extend(props, globals);

  ret[track.event()] = [props];
  return ret;
};

/**
 * Set up the Keen addons object. These must be specifically
 * enabled by the settings in order to include the plugins, or else
 * Keen will reject the request.
 *
 * https://keen.io/docs/data-collection/data-enrichment/#add-ons
 *
 * @param {Object} settings
 * @return {Array} addons
 */

function addons(settings){
  var addons = [];
  var ip = {
    name: 'keen:ip_to_geo',
    input: { ip: 'ip_address' },
    output: 'ip_geo_info'
  };
  var ua = {
    name: 'keen:ua_parser',
    input: { ua_string: 'user_agent' },
    output: 'parsed_user_agent'
  };
  var url = {
    name: 'keen:url_parser',
    input: { url: 'page_url' },
    output: 'parsed_page_url'
  };

  if (settings.ipAddon) addons.push(ip);
  if (settings.uaAddon) addons.push(ua);
  if (settings.urlAddon) addons.push(url);
  return addons;
}