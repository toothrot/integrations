
var Batch       = require('batch')
  , debug       = require('debug')('Segmentio:Mixpanel')
  , extend      = require('extend')
  , Integration = require('segmentio-integration')
  , is          = require('is')
  , objCase     = require('obj-case')
  , ms          = require('ms')
  , request     = require('request-retry')({ retries : 2 })
  , unixTime    = require('unix-time')
  , util        = require('util');


var errors = Integration.errors;


module.exports = Mixpanel;


function Mixpanel () {
  this.name    = 'Mixpanel';
  this.baseUrl = 'https://api.mixpanel.com';
}


util.inherits(Mixpanel, Integration);


Mixpanel.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
};


Mixpanel.prototype.validate = function (message, settings) {
  // Check whether we should import the message, uses a different endpoint
  var imported = shouldImport(message);

  var err = this._missingSetting(settings, 'token');
  if (imported && message.action() === 'track') {
    err = err || this._missingSetting(settings, 'apiKey');
  }

  return err;
};


/**
 * Identify the Mixpanel user.
 * https://mixpanel.com/help/reference/http#people-analytics-updates
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

  var req = {
    url : this.baseUrl + '/engage/',
    qs  : {
      ip      : 0,       // pass a flag to ignore the server-ip
      verbose : 1,       // make sure that we get a valid response
      data    : b64encode(payload)
    }
  };

  debug('making identify request', identify.userId() || identify.sessionId());
  request.get(req, this._parseResponse(callback));
};


/**
 * Track a Mixpanel event
 * https://mixpanel.com/help/reference/http#tracking-events
 */

Mixpanel.prototype.track = function (track, settings, callback) {
  var imported = shouldImport(track)
    , endpoint = imported ? '/import/' : '/track/';

  var payload = {
    event      : track.event(),
    properties : formatProperties(track, settings)
  };

  extend(payload.properties, superProperties(track));

  var req = {
    url : this.baseUrl + endpoint,
    qs  : {
      ip      : track.ip() || 0,
      verbose : 1,
      data    : b64encode(payload),
      api_key : settings.apiKey
    }
  };

  var batch = new Batch()
    , self  = this;

  debug('making track request', track.userId() || track.sessionId());
  batch.push(function (done) { request.post(req, self._parseResponse(done)); });

  if (track.revenue()) {
    batch.push(function (done) { self.revenue(track, settings, done); });
  }

  batch.end(callback);
};


/**
 * Alias a user from one id to the other
 * https://mixpanel.com/help/reference/http#distinct-id-alias
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

  var req = {
    url : this.baseUrl + '/track/',
    qs  : {
      ip      : 0,
      verbose : 1,
      data    : b64encode(payload),
      api_key : settings.apiKey
    }
  };

  debug('making alias request', from, to);
  request.post(req, this._parseResponse(callback));
};


/**
 * Common function for parsing the response from a mixpanel call.
 */

Mixpanel.prototype._parseResponse = function (callback) {
  return this._handleResponse(function (err, body) {
    if (err) return callback(err);

    try {
      body = JSON.parse(body);
      if (!body.status) err = new errors.BadRequest(body.error);
    } catch (e) {
      debug('failed to parse body: %s', body);
      err = e;
    }
    return callback(err);
  });
};


/**
 * Track a mixpanel revenue call
 * https://mixpanel.com/help/reference/http#tracking-revenue
 */

Mixpanel.prototype.revenue = function (track, settings, callback) {
  var ignoreIp = track.proxy('options.ignoreIp');
  if (ignoreIp === undefined) ignoreIp = true;

  var req = {
    url : this.baseUrl + '/engage/',
    qs  : {
      ip      : ignoreIp ? 0 : null,
      verbose : 1,
      data    : b64encode(formatRevenue(track, settings)),
    }
  };

  debug('making revenue request');
  request.get(req, this._parseResponse(callback));
};


/**
 * Add user super properties to the track.
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
 */

function formatTraits (identify) {

  var traits = identify.traits() || {};

  // https://mixpanel.com/help/reference/http#people-special-properties
  extend(traits, {
    $first_name : identify.firstName(),
    $last_name  : identify.lastName(),
    $email      : identify.email(),
    $phone      : identify.phone()
  });

  // Remove possible duplicate properties.
  objCase.del(traits, 'firstName');
  objCase.del(traits, 'lastName');
  objCase.del(traits, 'email');
  objCase.del(traits, 'phone');
  objCase.del(traits, 'created');

  if (identify.created()) traits['$created'] = formatDate(identify.created());

  stringifyValues(traits);
  return traits;
}


/**
 * Format the mixpanel specific properties.
 */

function formatProperties (track, settings) {

  var properties = track.properties() || {}
    , identify   = track.identify()
    , userAgent  = track.userAgent();

  extend(properties, {
    token          : settings.token,
    distinct_id    : track.userId() || track.sessionId(),
    time           : unixTime(track.timestamp()),
    mp_lib         : 'Segment.io',
    $search_engine : track.proxy('properties.searchEngine'),
    $referrer      : track.referrer(),
    $username      : track.username(),
    $query         : track.query(),
    $ip            : track.ip(),
  });

  // Remove possible duplicate properties.
  objCase.del(properties, 'referrer');
  objCase.del(properties, 'username');
  objCase.del(properties, 'query');
  objCase.del(properties, 'searchEngine');

  // Add the name tag
  properties.mp_name_tag = identify.name()   ||
                           identify.email()  ||
                           identify.userId() ||
                           identify.sessionId();

  stringifyValues(properties);

  if (userAgent) {
    extend(properties, {
      $browser : userAgent.browser.name,
      $os      : userAgent.os.name
    });
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
 * https://mixpanel.com/help/reference/http#dates-in-updates
 */

function formatDate (date) {
  return (new Date(date)).toISOString().slice(0,19);
}


/**
 * Mixpanel uses different endpoints for historical import.
 * https://mixpanel.com/docs/api-documentation/importing-events-older-than-31-days
 * @return {Boolean}
 */

function shouldImport (message) {
  var timestamp = message.timestamp() || new Date();
  return (Date.now() - timestamp.getTime()) > ms('5d');
}

/**
 * Base64 encode the payload
 */

function b64encode (payload) {
  return new Buffer(JSON.stringify(payload)).toString('base64');
}


/**
 * Stringify the nested values for an object.
 */

function stringifyValues (obj) {
  if (!is.object(obj)) return obj;

  Object.keys(obj).forEach(function (key) {
    var val = obj[key];
    if (is.object(val)) obj[key] = JSON.stringify(val);
  });

  return obj;
}