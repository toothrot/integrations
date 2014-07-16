
/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var integration = require('segmentio-integration');
var isostring = require('isostring');
var hash = require('string-hash');
var time = require('unix-time');
var extend = require('extend');
var dot = require('obj-case');
var Batch = require('batch');
var tick = process.nextTick;
var is = require('is');

/**
 * Expose `Intercom`
 */

var Intercom = module.exports = integration('Intercom')
  .endpoint('https://api-segment.intercom.io')
  .retries(2);

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

Intercom.prototype.identify = function(identify, settings, fn){
  var traits = formatTraits(identify.traits());
  var active = identify.active();
  var payload = {
    user_id: identify.userId(),
    custom_attributes: traits
  };

  if (identify.userAgent()) payload.last_seen_user_agent = identify.userAgent();
  if (identify.created()) payload.remote_created_at = time(identify.created());
  if (active) payload.last_request_at = time(identify.timestamp());
  if (identify.ip()) payload.last_seen_ip = identify.ip();
  if (identify.email()) payload.email = identify.email();
  if (identify.name()) payload.name = identify.name();

  // Add company data
  var companies = identify.proxy('traits.companies');
  var company = identify.proxy('traits.company');

  if (company) companies = [company];
  if (is.array(companies)) payload.companies = companies.map(formatCompany);

  return this
    .post('/users')
    .set(headers(identify, settings))
    .type('json')
    .accept('json')
    .send(payload)
    .end(this.handle(fn));
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
  var payload = {};
  payload.created = time(track.timestamp());
  payload.event_name = track.event();
  payload.user_id = track.userId();
  if (track.email()) payload.email = track.email();
  payload.metadata = track.properties();

  return this
    .post('/events')
    .set(headers(track, settings))
    .type('json')
    .accept('json')
    .send(payload)
    .end(this.handle(fn));
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
  return key + '_at';
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
    'Authorization': auth,
    'User-Agent': 'Segment.io/1.0.0'
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

  var ret = {};
  ret.name = company.name;
  ret.custom_attributes = company;
  ret.company_id = company.id || hash(company.name);
  var created = dot(company, 'created') || dot(company, 'createdAt');
  if (created) ret.remote_created_at = time(created);
  return ret;
}

