
var debug       = require('debug')('segmentio:integrations:customer.io')
  , Integration = require('segmentio-integration')
  , request     = require('request-retry')({ retries : 2 })
  , unixTime    = require('unix-time')
  , util        = require('util');


module.exports = CustomerIO;


function CustomerIO () {
  this.name = 'Customer.io';
  this.baseUrl = 'https://app.customer.io/api/v1/customers/';
}


util.inherits(CustomerIO, Integration);


/**
 * Check whether Customer.io is enabled. Make sure that there is a
 * `userId` field to ensure that there aren't anonymous users.
 */

CustomerIO.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server' &&
         typeof message.userId === 'function' &&
         message.userId() !== undefined;
};


/**
 * Validate the settings for the project
 */

CustomerIO.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'siteId') ||
         this._missingSetting(settings, 'apiKey');
};


/**
 * Update a Customer.io user
 * http://customer.io/docs/api/rest.html#section-Creating_or_updating_customers
 */

CustomerIO.prototype.identify = function (identify, settings, callback) {

  var id     = identify.userId()
    , traits = identify.traits();

  // Add specially recognized traits
  traits.email = identify.email();

  if (identify.created()) {
    traits.created_at = unixTime(identify.created());
    delete traits.created;
  }

  var req = {
    url     : this.baseUrl + id,
    json    : traits,
    headers : reqHeaders(settings)
  };

  debug('making identify request');
  request.put(req, this._handleResponse(callback));
};


/**
 * Track a Customer.io event
 * http://customer.io/docs/api/rest.html#section-Track_a_custom_event
 */

CustomerIO.prototype.track = function (track, settings, callback) {
  var self = this;
  this._visit(track, settings, function(err){
    if (err) return callback(err);
    var id = track.userId();
    var props = track.properties();

    var json = {
      timestamp: unixTime(track.timestamp()),
      name: track.event(),
      data: props,
    };

    var req = {
      url: self.baseUrl + id + '/events',
      headers: reqHeaders(settings),
      json: json
    };

    request.post(req, self._handleResponse(callback));
  });
};

/**
 * Send visit update to customer.io if `.active()` is `true`.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 */

CustomerIO.prototype._visit = function(track, settings, fn){
  if (!track.active()) return fn();
  var id = track.userId();
  var props = track.properties();

  var json = {
    _last_visit: unixTime(track.timestamp())
  };

  var req = {
    url: this.baseUrl + id,
    json: json,
    headers: reqHeaders(settings)
  };

  debug('updating last visit');
  request.put(req, this._handleResponse(fn));
};

/**
 * Add the authentication to the headers.
 */

function reqHeaders (settings) {
  var auth = settings.siteId + ':' + settings.apiKey;
  return {
    'Authorization' : 'Basic ' + new Buffer(auth).toString('base64')
  };
}






