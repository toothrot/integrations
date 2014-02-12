
var Cache       = require('lru-cache')
  , convert     = require('convert-dates')
  , debug       = require('debug')('segmentio:integrations:hubspot')
  , extend      = require('extend')
  , Integration = require('segmentio-integration')
  , is          = require('is')
  , isostring   = require('isostring')
  , ms          = require('ms')
  , traverse    = require('isodate-traverse')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util')
  , validQs     = require('valid-querystring');

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

  var self = this
    , traits = convertDates(track.traits());

  // Also add user traits to HubSpot track requests for backwards compat
  // and to mimic their js library
  this._filterProperties(traits, settings, function (err, traits) {
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

  var payload = convertDates(identify.traits());

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

    self._getByEmail(identify.email(), settings, function (err, user) {
      if (err) return callback(err);

      if (user) self._update(user.vid, properties, settings, callback);
      else self._create(properties, settings, callback);
    });
  });
};


/**
 * Updates a contact in HubSpot with the hubspot style `properties`
 *
 * @param {String} vid
 * @param {Array} properties
 * @param {Object} settings
 * @param {Function} callback  (err)
 */

HubSpot.prototype._update = function (vid, properties, settings, callback) {
  var url = util.format('%s/contact/vid/%s/profile', this.contactUrl, vid);
  var req = {
    url: url,
    qs: { hapikey: settings.apiKey },
    json: { properties: properties },
    headers: headers()
  };
  if (!validQs(req.qs)) return callback(new Error('Invalid querystring'));
  debug('updating contact %j', req);
  request.post(req, this._handleResponse(callback));
};


/**
 * Create a new contact in HubSpot. If the contact exists, try and update it
 * instead.
 *
 * @param {Object} properties
 * @param {Object} settings
 * @param {Function} callback  (err)
 */

HubSpot.prototype._create = function (properties, settings, callback) {
  var url = util.format('%s/contact/', this.contactUrl);
  var req = {
    url: url,
    qs: { hapikey: settings.apiKey },
    json: { properties: properties },
    headers: headers()
  };
  if (!validQs(req.qs)) return callback(new Error('Invalid querystring'));
  debug('creating contact %j', req);
  var self = this;
  request.post(req, function (err, res, body) {
    if (err) return callback(err);
    // If we receive anything other than a 409, return the request normally.
    if (res.statusCode !== 409) {
      return self._handleResponse(callback).apply(self, arguments);
    }

    // If we receive a 409, decide to update. That means that the requests
    // were interleaved and the contact exists.
    try {
      body = JSON.parse(body.message);
      var vid = body.property.vid;
      debug('contact with email %s already exists as %s', properties.email, vid);
      self._update(vid, properties, settings, callback);
    } catch (err) {
      callback(err);
    }
  });
};


/**
 * Gets a user by their email.
 *
 * @param {String} email
 * @param {Object} settings
 * @param {Function} callback  (err, user)
 */

HubSpot.prototype._getByEmail = function (email, settings, callback) {

  var path = util.format('/contact/email/%s/profile', email);

  var req = {
    url     : this.contactUrl + path,
    qs      : { hapikey : settings.apiKey },
    headers : headers(),
    json    : true
  };
  if (!validQs(req.qs)) return callback(new Error('Invalid querystring'));
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
 *
 * @param {Object} properties
 * @param {Object} settings
 * @param {Function} callback  (err, properties) a properties array
 */

HubSpot.prototype._filterProperties = function (properties, settings, callback) {

  this._getProperties(settings, function (err, existingProperties) {
    if (err) return callback(err);

    var filteredProperties = [];
    // hubspot passes all keys back as lowercase
    properties = lowercase(properties);
    existingProperties.forEach(function (property) {
      if (!properties.hasOwnProperty(property.name)) return;

      var value = properties[property.name];
      if (isostring(value)) value = new Date(value);
      if (is.date(value)) value = value.getTime();
      if (is.object(value) || is.array(value)) value = JSON.stringify(value);
      if (is.boolean(value)) value = value.toString();
      if (value && property.type === 'string') value = value.toString();

      debug('including property %s: %s', property.name, value);
      filteredProperties.push({
        property : property.name,
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
  if (!validQs(req.qs)) return callback(new Error('Invalid querystring'));
  request.get(req, this._handleResponse(function (err, body) {
    if (err) return callback(err);

    properties = body.filter(function (property) {
      return !property.readOnlyValue;
    });

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


/**
 * Hubspot requests that any dates be millisecond timestamps.
 */

function convertDates (object) {
  object = traverse(object);
  return convert(object, function (date) { return date.getTime(); });
}