
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var parse = require('ua-parser-js');
var object = require('obj-case');
var errors = integration.errors;
var time = require('unix-time');
var extend = require('extend');
var Batch = require('batch');
var tick = process.nextTick;
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

Mixpanel.prototype.validate = function(message, settings){
  // Check whether we should import the message, uses a different endpoint
  var imported = shouldImport(message);
  var err = this.ensure(settings.token, 'token');

  if (imported && message.type() === 'track') {
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

Mixpanel.prototype.identify = function(identify, settings, fn){
  if (!settings.people) return tick(fn);

  var ignoreIp = identify.proxy('options.ignoreIp')  // TODO: remove
    || identify.proxy('options.Mixpanel.ignoreIp');

  var ignoreTime = identify.proxy('options.ignoreTime') // TODO: remove
    || identify.proxy('options.Mixpanel.ignoreTime')
    || !identify.active();

  var payload = {
    $distinct_id: identify.userId() || identify.sessionId(), // the primary id
    $token: settings.token,
    $time: identify.timestamp().getTime(),
    $set: formatTraits(identify),     // set all the traits on identify
    $ip: ignoreIp ? 0 : identify.ip() || 0, // use the ip passed in
    $ignore_time: ignoreTime,
    mp_lib: 'Segment.io'
  };

  var query = {
    ip: 0,            // pass a flag to ignore the server-ip
    verbose: 1,       // make sure that we get a valid response
    data: b64encode(payload)
  };

  this
    .get('/engage')
    .query(query)
    .end(this._parseResponse(fn));
};

/**
 * Track a Mixpanel event
 *
 * https://mixpanel.com/help/reference/http#tracking-events
 *
 * TODO: update people's profile when increment is found.
 * see: https://mixpanel.com/help/reference/http#update-operations
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
  var payload = {
    event: track.event(),
    properties: formatProperties(track, settings)
  };

  extend(payload.properties, superProperties(track, settings));

  var query = {
    verbose: 1,
    data: b64encode(payload),
    api_key: settings.apiKey
  };

  // increment
  if (settings.people) {
    batch.push(function(fn){
      self.increment(track, settings, fn);
    });
  }

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
 * Track Page / Screen using `msg`.
 *
 * TODO:
 *
 *    In the new Integration proto abstract this away,
 *    doing `if's` in each integration is annoying,
 *    we can automate this even for integrations
 *    that map to page -> track -- this will reduce errors.
 *
 * @param {Track|Screen} msg
 * @param {Object} settings
 * @param {Function} fn
 */

Mixpanel.prototype.screen =
Mixpanel.prototype.page = function(msg, settings, fn){
  var batch = new Batch;
  var category = msg.category();
  var name = msg.fullName();
  var self = this;

  // all
  if (settings.trackAllPages) {
    batch.push(track(msg.track()));
  }

  // categorized
  if (category && settings.trackCategorizedPages) {
    batch.push(track(msg.track(category)));
  }

  // named
  if (name && settings.trackNamedPages) {
    batch.push(track(msg.track(name)));
  }

  // call track with `msg`.
  function track(msg){
    return function(done){
      self.track(msg, settings, function(err, arr){
        if (err) return done(err);
        done(null, arr[1]);
      });
    };
  }

  batch.end(fn);
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

Mixpanel.prototype.alias = function(alias, settings, fn){
  var previousId = alias.previousId();
  var userId = alias.userId();
  var payload = {
    event: '$create_alias',
    properties: {
      distinct_id: previousId,
      alias: userId,
      token: settings.token
    }
  };

  this
    .post('/track')
    .query({ ip: 0 })
    .query({ verbose: 1 })
    .query({ data: b64encode(payload) })
    .query({ api_key: settings.apiKey })
    .set('Content-Length', 0) // mixpanel rejects length-less requests
    .end(this._parseResponse(fn));
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

Mixpanel.prototype.revenue = function(track, settings, fn){
  var ignoreIp = track.proxy('options.ignoreIp');
  if (ignoreIp === undefined) ignoreIp = true;
  var req = this.get('/engage');
  if (ignoreIp) req.query({ ip: 0 });
  req
    .query({ verbose: 1 })
    .query({ data: b64encode(formatRevenue(track, settings)) })
    .end(this._parseResponse(fn));
};

/**
 * Increment the given `track` with `settings` and `callback`.
 *
 * Unfortunately Mixpanel doesn't let you specify 2 operations,
 * so we request twice, once for `$add` and once for `$set`.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

Mixpanel.prototype.increment = function(track, settings, fn){
  var increments = getIncrements(track, settings);
  var batch = new Batch;
  var self = this;

  // ignore
  if (!increments) return tick(fn);
  if (!track.userId()) return tick(fn);

  // send
  batch.push(send('$add'));
  batch.push(send('$set'));
  batch.end(fn);

  // send `type`
  function send(type){
    return function(done){
      var payload = {};
      payload.$distinct_id = track.userId();
      payload.$token = settings.token;
      payload.mp_lib = 'Segment.io';
      payload[type] = increments[type];
      var b64 = b64encode(payload);

      return self
        .get('/engage')
        .query({ ip: 0 })
        .query({ verbose: 1 })
        .query({ data: b64 })
        .end(self._parseResponse(done));
    };
  }
};

/**
 * Common function for parsing the response from a mixpanel call.
 *
 * @param {Function} fn
 * @api private
 */

Mixpanel.prototype._parseResponse = function(fn){
  return this.handle(function(err, res){
    if (err) return fn(err);
    if (!res.body.status) return fn(new errors.BadRequest(res.body.error));
    fn(null, res);
  });
};

/**
 * Add user super properties to the track.
 *
 * @param {Track} track
 * @return {Object}
 * @api private
 */

function superProperties(track, settings){
  var identify = track.identify();
  var traits = formatTraits(identify) || {};
  var properties = {};

  if (!is.object(traits)) return properties;

  Object.keys(traits).forEach(function(trait){
    var val = traits[trait];
    // an early version of the integrations prefixed traits incorrectly
    // the setting preserves backwards compat.
    if (settings.legacySuperProperties && trait.charAt(0) !== '$') {
      trait = '$' + trait;
    }
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

function formatTraits(identify){
  var traits = identify.traits() || {};

  // https://mixpanel.com/help/reference/http#people-special-properties
  extend(traits, {
    $first_name: identify.firstName(),
    $last_name: identify.lastName(),
    $email: identify.email(),
    $phone: identify.phone(),
    $username: identify.username()
  });

  // Remove possible duplicate properties.
  object.del(traits, 'firstName');
  object.del(traits, 'lastName');
  object.del(traits, 'email');
  object.del(traits, 'phone');
  object.del(traits, 'username');
  object.del(traits, 'created');
  object.del(traits, 'createdAt');

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

function formatProperties(track, settings){
  var properties = track.properties() || {};
  var identify = track.identify();
  var userAgent = track.userAgent();

  extend(properties, {
    token: settings.token,
    distinct_id: track.userId() || track.sessionId(),
    time: time(track.timestamp()),
    mp_lib: 'Segment.io',
    $search_engine: track.proxy('properties.searchEngine'),
    $referrer: track.referrer(),
    $username: track.username(),
    $query: track.query(),
    ip: track.ip()
  });

  // Remove possible duplicate properties.
  object.del(properties, 'referrer');
  object.del(properties, 'username');
  object.del(properties, 'query');
  object.del(properties, 'searchEngine');

  // Add the name tag
  properties.mp_name_tag = identify.name()
    || identify.email()
    || identify.userId()
    || identify.sessionId();

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
 *
 * https://mixpanel.com/help/reference/http#tracking-revenue
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

function formatRevenue(track, settings){
  return {
    $distinct_id: track.userId() || track.sessionId(),
    $token: settings.token,
    $ip: track.ip(),
    $append: {
      $transactions: {
        $time: formatDate(track.timestamp()),
        $amount: track.revenue()
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

function formatDate(date){
  date = new Date(date);
  if (isNaN(date.getTime())) return;
  return date.toISOString().slice(0,19);
}

/**
 * Get increments.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

function getIncrements(track, settings){
  var inc = lowercase(settings.increments || []);
  var event = track.event();
  if (!~inc.indexOf(event.toLowerCase())) return;
  var ret = { $set: {}, $add: {} };
  ret.$set['Last ' + event] = formatDate(track.timestamp());
  ret.$add[event] = 1;
  return ret;
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

function shouldImport(message){
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

function b64encode(payload){
  return new Buffer(JSON.stringify(payload)).toString('base64');
}

/**
 * Stringify the nested values for an object.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function stringifyValues(obj){
  if (!is.object(obj)) return obj;

  Object.keys(obj).forEach(function (key) {
    var val = obj[key];
    if (is.object(val)) obj[key] = JSON.stringify(val);
  });

  return obj;
}

/**
 * Lowercase the given `arr`.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function lowercase(arr){
  var ret = [];

  for (var i = 0; i < arr.length; ++i) {
    ret.push(String(arr[i]).toLowerCase());
  }

  return ret;
}
