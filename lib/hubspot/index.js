
var Cache       = require('lru-cache')
  , debug       = require('debug')('segmentio:integrations:hubspot')
  , extend      = require('extend')
  , Integration = require('segmentio-integration')
  , is          = require('is')
  , isostring   = require('isostring')
  , ms          = require('ms')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util');

var errors = Integration.errors;


module.exports = HubSpot;


function HubSpot () {
  this.name = 'HubSpot';
  this.trackUrl = 'https://track.hubspot.com/v1';
  this.contactUrl = 'https://api.hubapi.com/contacts/v1';
  this.propertiesCache = new Cache({
    maxAge : ms('1h'),
    max    : 500
  }); // cache properties by api key
}


util.inherits(HubSpot, Integration);


HubSpot.prototype.enabled = function (message, settings) {
  // HubSpot requires an email and explicitly enabled settings since
  // it is disabled by default to avoid rate limiting.
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server' &&
         message.email && message.email();
};


HubSpot.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'portalId') ||
         this._missingSetting(settings, 'apiKey');
};


/**
 * Records a HubSpot event, this is only enabled for enterprise customers.
 * https://developers.hubspot.com/docs/methods/enterprise_events/http_api
 *
 * Check here: https://app.hubspot.com/analyze/{{ portalId }}/events/
 */

HubSpot.prototype.track = function (track, settings, callback) {

  var payload = {
    _a    : settings.portalId,
    _n    : track.event(),
    _m    : track.revenue(),
    email : track.email(),
  };

  var self = this;

  // Also add user traits to HubSpot track requests for backwards compat
  // and to mimic their js library
  this._filterProperties(track.traits(), settings, function (err, traits) {
    if (err) return callback(err);

    traits.forEach(function (trait) {
      payload[trait.property] = trait.value;
    });

    var req = {
      url     : self.trackUrl + '/event',
      qs      : payload,
      headers : headers()
    };

    debug('Sending event track request');
    request.get(req, self._handleResponse(callback));
  });
};


/**
 * Identify a user by creating or updating their account in HubSpot, filtering
 * out traits which are not created in the HubSpot interface.
 *
 * https://developers.hubspot.com/docs/methods/contacts/update_contact
 * https://developers.hubspot.com/docs/methods/contacts/create_contact
 *
 * See your settings page for the list of properties:
 * https://app.hubspot.com/contacts/{{your portal id}}/settings/
 */

HubSpot.prototype.identify = function (identify, settings, callback) {

  var payload = identify.traits();

  extend(payload, {
    email      : identify.email(),
    firstname  : identify.firstName(),
    lastname   : identify.lastName(),
    phone      : identify.phone(),
    address    : identify.address(),
    city       : identify.proxy('traits.city'),
    zip        : identify.proxy('traits.zip'),
    jobtitle   : identify.proxy('traits.jobTitle')
  });

  // hubspot takes datetime in ms
  // https://groups.google.com/forum/#!searchin/hubspot-api/datetime/hubspot-api/azXRWXWWLVc/oiSmkT2Y_DcJ
  if (identify.created()) payload.createdate = identify.created().getTime();

  var self = this;

  // filter for existing properties
  this._filterProperties(payload, settings, function (err, properties) {
    if (err) return callback(err);

    // check to see whether we should update the user, or create one
    self._getByEmail(identify.email(), settings, function (err, user) {
      if (err) return callback(err);
      var path = user ? util.format('/contact/vid/%s/profile', user.vid) :
                       '/contact/';

      var req = {
        url     : self.contactUrl + path,
        qs      : { hapikey : settings.apiKey },
        json    : { properties : properties },
        headers : headers()
      };

      request.post(req, self._handleResponse(callback));
    });
  });
};


/**
 * Gets a user by their email.
 */

HubSpot.prototype._getByEmail = function (email, settings, callback) {

  var path = util.format('/contact/email/%s/profile', email);

  var req = {
    url     : this.contactUrl + path,
    qs      : { hapikey : settings.apiKey },
    headers : headers(),
    json    : true
  };

  request.get(req, function (err, res, body) {
    if (err) return callback(err);
    if (res.statusCode === 404) {
      debug('user %s did not exist', email);
      return callback();
    }

    if (res.statusCode === 200) {
      debug('user %s found successfully', email);
      return callback(null, body);
    }

    debug('received a bad hubspot status %s', res.statusCode);
    callback(new errors.BadRequest('Error making hubspot request',
                                    res.statusCode, body));
  });
};


/**
 * Filter the new properties for only ones which already exist
 *
 * Returns them as an array in the form that HubSpot expects.
 */

HubSpot.prototype._filterProperties = function (properties, settings, callback) {

  this._getProperties(settings, function (err, existingProperties) {
    if (err) return callback(err);

    var filteredProperties = [];
    // hubspot passes all keys back as lowercase
    properties = lowercase(properties);
    existingProperties.forEach(function (propertyName) {
      if (!properties.hasOwnProperty(propertyName)) return;

      var value = properties[propertyName];
      if (isostring(value)) value = new Date(value);
      if (is.date(value)) value = value.getTime();

      debug('including property %s', propertyName);
      filteredProperties.push({
        property : propertyName,
        value    : value
      });
    });

    debug('filtered properties');
    return callback(null, filteredProperties);
  });
};


/**
 * Gets the properties from the cache or from the HubSpot API
 */

HubSpot.prototype._getProperties = function (settings, callback) {

  var apiKey     = settings.apiKey
    , properties = this.propertiesCache.peek(apiKey);

  if (properties) {
    debug('found properties in cache');
    return process.nextTick(function () { callback(null, properties); });
  }

  var req = {
    url     : this.contactUrl + '/properties',
    qs      : { hapikey : apiKey },
    headers : headers(),
    json    : true
  };

  var self = this;

  request.get(req, this._handleResponse(function (err, body) {
    if (err) return callback(err);

    properties = body
                  .filter(function (property) { return !property.readOnlyValue;})
                  .map(function (property) { return property.name; });

    debug('retrieved properties from server');
    self.propertiesCache.set(apiKey, properties);
    return callback(null, properties);
  }));
};


/**
 * Add the headers to the request
 * https://developers.hubspot.com/docs/api_notes
 */

function headers () {
  return {
    'User-Agent'   : 'Segment.io/1.0'
  };
}


/**
 * Lowercase the keys of the object
 */

function lowercase (object) {
  var output = {};
  Object.keys(object).forEach(function (key) {
    output[key.toLowerCase()] = object[key];
  });
  return output;
}