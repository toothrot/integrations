
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var parse = require('ua-parser-js');
var object = require('obj-case');
var time = require('unix-time');
var extend = require('extend');
var Batch = require('batch');
var ms = require('ms');
var is = require('is');

/**
 * Expose `Mixpanel`
 */

var Mixpanel = module.exports = integration('Mixpanel')
  .endpoint('https://api.mixpanel.com')
  .retries(2);

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

Mixpanel.prototype.validate = function (message, settings) {
  // Check whether we should import the message, uses a different endpoint
  var imported = shouldImport(message);
  var err = this.ensure(settings.token, 'token');

  if (imported && message.action() === 'track') {
    err = err || this.ensure(settings.apiKey, 'apiKey');
  }

  return err;
};

/**
 * Identify the Mixpanel user.
 *
 * https://mixpanel.com/help/reference/http#people-analytics-updates
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Mixpanel.prototype.identify = function (identify, settings, callback) {
  if (!settings.people) return process.nextTick(callback);

  var ignoreIp = identify.proxy('options.ignoreIp') ||  // TODO: remove
                 identify.proxy('options.Mixpanel.ignoreIp');

  var ignoreTime = identify.proxy('options.ignoreTime') ||  // TODO: remove
                   identify.proxy('options.Mixpanel.ignoreTime') ||
                   !identify.active();

  var payload = {
    $distinct_id : identify.userId() || identify.sessionId(), // the primary id
    $token       : settings.token,
    $time        : identify.timestamp().getTime(),
    $set         : formatTraits(identify),     // set all the traits on identify
    $ip          : ignoreIp ? 0 : identify.ip() || 0, // use the ip passed in
    $ignore_time : ignoreTime,
    mp_lib       : 'Segment.io'
  };

  var query = {
    ip      : 0,       // pass a flag to ignore the server-ip
    verbose : 1,       // make sure that we get a valid response
    data    : b64encode(payload)
  };

  var req = this.get('/engage');
  req.query(query);
  req.end(this._parseResponse(callback));
};

/**
 * Track a Mixpanel event
 * https://mixpanel.com/help/reference/http#tracking-events
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Mixpanel.prototype.track = function (track, settings, callback) {
  var imported = shouldImport(track)
  var endpoint = imported ? '/import' : '/track';
  var batch = new Batch;
  var self = this;
  var query = {};

  var payload = {
    event      : track.event(),
    properties : formatProperties(track, settings)
  };

  extend(payload.properties, superProperties(track));

  var query = {
    verbose: 1,
    data: b64encode(payload),
    api_key: settings.apiKey
  };

  batch.push(function(done){
    self
    .post(endpoint)
    .set('Content-Length', 0)
    .query(query)
    .end(self._parseResponse(done));
  });

  if (track.revenue()) {
    batch.push(function(done){
      self.revenue(track, settings, done);
    });
  }

  batch.end(callback);
};

/**
 * Alias a user from one id to the other
 *
 * https://mixpanel.com/help/reference/http#distinct-id-alias
 *
 * @param {Alias} alias
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Mixpanel.prototype.alias = function (alias, settings, callback) {
  var from = alias.from()
    , to   = alias.to();

  var payload = {
    event      : '$create_alias',
    properties : {
      distinct_id : from,
      alias       : to,
      token       : settings.token
    }
  };

  var query = {
    ip      : 0,
    verbose : 1,
    data    : b64encode(payload),
    api_key : settings.apiKey
  };

  var req = this.post('/track');
  req.query(query);
  req.set('Content-Length', 0);
  req.end(this._parseResponse(callback));
};

/**
 * Common function for parsing the response from a mixpanel call.
 *
 * @param {Function} fn
 * @api private
 */

Mixpanel.prototype._parseResponse = function (callback) {
  return this.handle(function (err, res) {
    if (err) return callback(err);
    if (!res.body.status) err = new errors.BadRequest(res.body.error);
    if (err) return callback(err);
    callback(null, res);
  });
};


/**
 * Track a mixpanel revenue call
 *
 * https://mixpanel.com/help/reference/http#tracking-revenue
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} callback
 * @api private
 */

Mixpanel.prototype.revenue = function (track, settings, callback) {
  var ignoreIp = track.proxy('options.ignoreIp');
  if (ignoreIp === undefined) ignoreIp = true;
  var req = this.get('/engage');
  if (ignoreIp) req.query({ ip: 0 });
  req.query({ verbose: 1 });
  req.query({ data: b64encode(formatRevenue(track, settings)) });
  req.end(this._parseResponse(callback));
};


/**
 * Add user super properties to the track.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

function superProperties (track) {
  var identify = track.identify()
    , traits   = formatTraits(identify) || {};

  var properties = {};

  if (!is.object(traits)) return properties;

  Object.keys(traits).forEach(function (trait) {
    var val = traits[trait];

    // TODO: fix me. Traits always adds a $ in v1. Currently added for
    // backwards compatibility
    if (trait.charAt(0) !== '$') trait = '$' + trait;
    properties[trait] = val;
  });

  return properties;
}

/**
 * Format the traits from the identify
 *
 * @param {Identify} identify
 * @return {Object}
 * @api private
 */

function formatTraits (identify) {
  var traits = identify.traits() || {};

  // https://mixpanel.com/help/reference/http#people-special-properties
  extend(traits, {
    $first_name : identify.firstName(),
    $last_name  : identify.lastName(),
    $email      : identify.email(),
    $phone      : identify.phone(),
    $username   : identify.username()
  });

  // Remove possible duplicate properties.
  object.del(traits, 'firstName');
  object.del(traits, 'lastName');
  object.del(traits, 'email');
  object.del(traits, 'phone');
  object.del(traits, 'username');
  object.del(traits, 'created');

  if (identify.created()) traits['$created'] = formatDate(identify.created());

  stringifyValues(traits);
  return traits;
}

/**
 * Format the mixpanel specific properties.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

function formatProperties (track, settings) {
  var properties = track.properties() || {}
    , identify   = track.identify()
    , userAgent  = track.userAgent();

  extend(properties, {
    token          : settings.token,
    distinct_id    : track.userId() || track.sessionId(),
    time           : time(track.timestamp()),
    mp_lib         : 'Segment.io',
    $search_engine : track.proxy('properties.searchEngine'),
    $referrer      : track.referrer(),
    $username      : track.username(),
    $query         : track.query(),
    ip             : track.ip()
  });

  // Remove possible duplicate properties.
  object.del(properties, 'referrer');
  object.del(properties, 'username');
  object.del(properties, 'query');
  object.del(properties, 'searchEngine');

  // Add the name tag
  properties.mp_name_tag = identify.name()   ||
                           identify.email()  ||
                           identify.userId() ||
                           identify.sessionId();

  stringifyValues(properties);

  if (userAgent) {
    var parsed = parse(userAgent);
    var browser = parsed.browser
    var os = parsed.os;
    if (browser) properties.$browser = browser.name + ' ' + browser.version;
    if (os) properties.$os = os.name + ' ' + os.version;
  }

  return properties;
}


/**
 * Create a revenue track call
 * https://mixpanel.com/help/reference/http#tracking-revenue
 */

function formatRevenue (track, settings) {
  return {
    $distinct_id : track.userId() || track.sessionId(),
    $token       : settings.token,
    $ip          : track.ip(),
    $append : {
      $transactions : {
        $time   : formatDate(track.timestamp()),
        $amount : track.revenue()
      }
    }
  };
}

/**
 * Formats a date for Mixpanel's API, takes the first part of the iso string
 *
 * https://mixpanel.com/help/reference/http#dates-in-updates
 *
 * @param {Mixed} date
 * @return {String}
 * @api private
 */

function formatDate (date) {
  date = new Date(date);
  if (isNaN(date.getTime())) return;
  return date.toISOString().slice(0,19);
}

/**
 * Mixpanel uses different endpoints for historical import.
 *
 * https://mixpanel.com/docs/api-documentation/importing-events-older-than-31-days
 *
 * @param {Facade} message
 * @return {Boolean}
 * @api private
 */

function shouldImport (message) {
  var timestamp = message.timestamp() || new Date();
  return (Date.now() - timestamp.getTime()) > ms('5d');
}

/**
 * Base64 encode the payload
 *
 * @param {Object} payload
 * @return {String}
 * @api private
 */

function b64encode (payload) {
  return new Buffer(JSON.stringify(payload)).toString('base64');
}

/**
 * Stringify the nested values for an object.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function stringifyValues (obj) {
  if (!is.object(obj)) return obj;

  Object.keys(obj).forEach(function (key) {
    var val = obj[key];
    if (is.object(val)) obj[key] = JSON.stringify(val);
  });

  return obj;
}
