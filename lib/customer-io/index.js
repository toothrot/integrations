
var integration = require('segmentio-integration');
var unix = require('unix-time');
var util = require('util');


/**
 * Expose `Customerio` integration.
 */

var Customerio = module.exports = integration('Customer.io')
  .url('https://app.customer.io/api/v1/customers/');


/**
 * Identify.
 *
 * http://customer.io/docs/api/rest.html#section-Creating_or_updating_customers
 *
 * @param {Facade} identify
 * @param {Object} settings
 * @param {Function} callback
 */

Customerio.prototype.identify = function (identify, settings, callback) {
  var req = {
    url: this.url() + identify.id(),
    headers: headers(settings),
    json: traits(identify)
  };

  this.debug('identifying');
  this.request.put(req, callback);
};


/**
 * Track.
 *
 * http://customer.io/docs/api/rest.html#section-Track_a_custom_event
 *
 * @param {Facade} track
 * @param {Object} settings
 * @param {Function} callback
 */

Customerio.prototype.track = function (track, settings, callback) {
  var req = {
    url: this.url() + track.id() + '/events',
    headers: headers(settings),
    json: {
      name: track.event(),
      data: track.properties(),
      timestamp: unix(track.timestamp())
    }
  };

  this.debug('tracking');
  this.request.post(req, callback);
};


/**
 * Render authentication headers.
 *
 * @param {Object} settings
 * @return {Object}
 */

function headers (settings) {
  var auth = settings.siteId + ':' + settings.apiKey;
  return {
    Authorization: 'Basic ' + new Buffer(auth).toString('base64')
  };
}


/**
 * Return the cleaned traits from an `identify` facade.
 *
 * @param {Facade} identify
 * @return {Object}
 */

function traits (identify) {
  var obj = identify.traits();

  if (identify.email()) {
    traits.email = identify.email();
  }

  if (identify.created()) {
    traits.created_at = unix(identify.created());
    delete traits.created;
  }

  return obj;
}