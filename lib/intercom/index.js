
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var Identify = require('segmentio-facade').Identify;
var isostring = require('isostring');
var hash = require('string-hash');
var object = require('obj-case');
var time = require('unix-time');
var extend = require('extend');
var Batch = require('batch');
var is = require('is');

/**
 * Expose `Intercom`
 */

var Intercom = module.exports = integration('Intercom')
  .endpoint('https://api.intercom.io/v1')
  .retries(2);

/**
 * Initialize
 *
 * @api private
 */

Intercom.prototype.initialize = function(){
  this.eventsEndpoint = 'https://api.intercom.io/v2/users/events';
};

/**
 * Enabled.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

Intercom.prototype.enabled = function(message, settings){
  return message.enabled(this.name)
    && 'server' == message.channel()
    && null != message.userId
    && null != message.userId();
};

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

Intercom.prototype.validate = function (message, settings) {
  return this.ensure(settings.apiKey, 'apiKey')
    || this.ensure(settings.appId, 'appId');
};

/**
 * Identify a user in intercom
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Intercom.prototype.identify = function (identify, settings, callback) {
  var self = this;
  this._updateUser(identify, settings, function (err) {
    if (err) return callback(err);
    if (!identify.active()) return callback();
    self._logImpression(identify, settings, callback);
  });
};

/**
 * Group.
 *
 * @param {Group} group
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Intercom.prototype.group = function(group, settings, fn){
  var json = group.json();
  var traits = json.traits || {};
  json.userId = group.field('userId');
  traits.id = group.groupId();
  json.traits = { companies: [traits] };
  var identify = new Identify(json);
  this.identify(identify, settings, fn);
};

/**
 * Track the user's action
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Intercom.prototype.track = function (track, settings, fn) {
  var props = track.properties();
  var payload = {};
  var self = this;

  payload.user = { user_id: track.userId() };
  payload.type = 'event.list';
  payload.data = [{
    created: time(track.timestamp()),
    event_name: track.event(),
    metadata: track.properties()
  }];

  return this
    .post(this.eventsEndpoint)
    .set(headers(track, settings))
    .type('json')
    .send(payload)
    .end(this.handle(function(err){
      if (err) return fn(err);
      self._logImpression(track, settings, fn);
    }));
};

/**
 * Create an intercom impression:
 *
 * TODO: remove and add .page() instead.
 *
 * http://docs.intercom.io/api#creating_an_impression
 *
 * @param {Facade} message
 * @param {Object} settings
 * @param {Function} callback
 * @api private
 */

Intercom.prototype._logImpression = function (message, settings, callback) {
  var payload = {
    user_id: message.userId(),
    email:   message.email(),
  };

  if (message.ip()) payload.user_ip = message.ip();

  var ua = message.userAgent();
  if (ua) payload.user_agent = ua.full;

  return this
    .post('/users/impressions')
    .set(headers(message, settings))
    .type('json')
    .send(payload)
    .end(this.handle(callback));
};

/**
 * Update a user with custom data
 *
 * http://docs.intercom.io/#CustomData
 * http://docs.intercom.io/api#creating_a_user
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} callback
 * @api private
 */

Intercom.prototype._updateUser = function (identify, settings, callback) {
  var traits = formatTraits(identify.traits());
  var active = identify.active();

  extend(traits, {
    user_id: identify.userId(),
    email: identify.email(),
    name: identify.name()
  });

  if (active) traits.last_request_at = time(identify.timestamp());
  if (identify.created()) traits.created_at = time(identify.created());

  // Add company data
  var company   = identify.proxy('traits.company');
  var companies = identify.proxy('traits.companies');

  if (company) companies = [company];
  if (companies) {
    if (Array.isArray(companies)) traits.companies = companies.map(formatCompany);
    else object.del(traits, 'companies'); // intercom 500s if this is the case
  }

  return this
    .put('/users')
    .set(headers(identify, settings))
    .type('json')
    .send(traits)
    .end(this.handle(callback));
};

/**
 * Format all the traits which are dates for intercoms format
 *
 * @param {Object} traits
 * @return {Object}
 * @api private
 */

function formatTraits (traits) {
  var output = {};

  Object.keys(traits).forEach(function (key) {
    var val = traits[key];
    if (isostring(val) || is.date(val)) {
      val = time(val);
      key = dateKey(key);
    }

    output[key] = val;
  });

  return output;
}

/**
 * Set up a key with the dates for intercom
 *
 * http://docs.intercom.io/#CustomDataDates
 *
 * @param {String} key
 * @return {String}
 * @api private
 */

function dateKey (key) {
  if (endswith(key, '_at')) return key;
  if (endswith(key, ' at')) return key.substr(0, key.length - 3) + '_at';
  return key;
}

/**
 * Test whether a string ends with the suffix
 *
 * @param {String} str
 * @param {String} suffix
 * @return {String}
 * @api private
 */

function endswith (str, suffix) {
  str = str.toLowerCase();
  return str.substr(str.length - suffix.length) === suffix;
}

/**
 * Add headers
 *
 * @param {Facade} message
 * @return {Object}
 * @api private
 */

function headers (message, settings) {
  var buf = new Buffer(settings.appId + ':' + settings.apiKey);
  var auth = 'Basic ' + buf.toString('base64');
  return {
    'Authorization' : auth,
    'User-Agent'    : 'Segment.io/1.0.0'
  };
}

/**
 * Formats a company for use with intercom
 *
 * http://docs.intercom.io/#Companies
 *
 * @param {Object} company
 * @return {Object}
 * @api private
 */

function formatCompany (company) {
  if (is.string(company)) company = { name : company };
  if (company.created) company.created_at = time(company.created);
  if (!company.id && !company.name) return company;
  company.id = company.id || hash(company.name);
  return company;
}

