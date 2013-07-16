
var Provider = require('../provider')
  , Cache    = require('lru-cache')
  , util     = require('util')
  , type     = require('component-type');


module.exports = HubSpot;


function HubSpot () {
  Provider.call(this);
  this.name = 'HubSpot';
  this.trackUrl = 'https://track.hubspot.com/v1';
  this.contactUrl = 'https://api.hubapi.com/contacts/v1';
  this.propertiesCache = new Cache();
}


util.inherits(HubSpot, Provider);


HubSpot.prototype.enabled = function (message, settings) {
  var enabled = message.channel() === 'server';

  // For track messages, they must explicitly enable the HubSpot provider
  // This avoids the expensive rate-limiting of pricey HubSpot plans
  if (!message.options(this.name)) enabled = false;

  // HubSpot requires an email
  if (!message.email || !message.email()) enabled = false;

  return enabled;
};


HubSpot.prototype.validate = function (message, settings) {
  return this._validateSetting(settings, 'portalId') &&
         this._validateSetting(settings, 'apiKey');
};


/**
 * Records a HubSpot event
 * https://developers.hubspot.com/docs/methods/enterprise_events/http_api
 */

HubSpot.prototype.track = function (track, settings, callback) {

  var payload = track.properties();

  extend(payload, {
    _a    : settings.portalId,
    _n    : track.event(),
    _m    : track.revenue(),
    email : track.email(),
  });

  var req = {
    url : this.trackUrl + '/event/',
    qs  : payload
  };

  debug('Sending event track request');
  request.get(req, this._handleResponse(callback));
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
    city       : identify.proxy('city', 'traits'),
    zip        : identify.proxy('zip',  'traits'),
    jobtitle   : identify.proxy('job title', 'traits')
  });

  // hubspot takes datetime in ms
  // https://groups.google.com/forum/#!searchin/hubspot-api/datetime/hubspot-api/azXRWXWWLVc/oiSmkT2Y_DcJ
  if (identify.created()) payload.createdate = identify.created().getTime();

  var self = this;

  // filter for existing properties
  this._filterProperties(payload, settings, function (err, properties) {
    if (err) return callback(err);

    // check to see whether we should update the user, or create one
    self._getByEmail(email, settings, function (err, user) {
      if (err) return callback(err);

      var path = user ? util.format('/contact/vid/%s/profile', user.id) :
                       '/contact/';

      var req = {
        url  : self.contactUrl + path,
        qs   : { hapikey : settings.apiKey },
        json : { properties : properties }
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
    url  : this.contactUrl + path,
    qs   : { hapikey : settings.apiKey },
    json : true
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

    existingProperties.forEach(function (propertyName) {
      if (properties.hasOwnProperty(propertyName)) {
        var value = properties[propertyName];
        if (type(value) === 'date') value = value.getTime();

        filteredProperties.push({
          property : propertyName,
          value    : value
        });
      }
    });

    debug('filtered properties');
    return callback(null, filteredProperties);
  });
};


/**
 * Gets the properties from the cache or from the HubSpot API
 */

HubSpot.prototype._getProperties = function (settings, callbck) {

  var apiKey     = settings.apiKey
    , properties = this.propertiesCache.peek(apiKey);

  if (properties) {
    debug('found properties in cache');
    return process.nextTick(function () { callback(null, properties); });
  }

  var req = {
    url  : this.contactUrl + '/properties',
    qs   : { hapikey : apiKey },
    json : true
  };

  request.get(req, this._handleResponse(function (err, body) {
    if (err) return callback(err);

    properties = body.map(function (property) { return property.name; });

    debug('retrieved properties from server');
    this.propertiesCache.set(apiKey, properties);
    return callback(null, properties);
  }));
};


