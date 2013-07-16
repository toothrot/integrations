
var Provider = require('../provider')
  , Cache    = require('lru-cache')
  , util     = require('util');


module.exports = HubSpot;


function HubSpot () {
  Provider.call(this);
  this.name = 'HubSpot';
  this.trackUrl = 'https://track.hubspot.com/v1';
  this.apiUrl = 'https://api.hubapi.com/';
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

  this._getProperties(settings, function (err, properties) {
    if (err) return callback(err);



  });
};


HubSpot.prototype._filterProperties = function (properties, settings, callback) {

  this._getProperties(settings, function (err, existingProperties) {
    if (err) return callback(err);


  });
}


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
    url  : this.apiUrl + '/contacts/v1/properties',
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


