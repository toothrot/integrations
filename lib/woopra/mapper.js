
/**
 * Module dependencies.
 */

var crypto = require('crypto');
var extend = require('extend');

/**
 * Map `identify`.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.identify = function(identify, settings){
  var traits = prefixKeys(identify.traits(), 'cv_');
  return extend(traits, {
    cv_company: identify.proxy('traits.company'),
    timestamp: identify.timestamp().getTime(),
    timeout: timeout(identify, settings),
    cookie: cookie(identify),
    cv_name: identify.name(),
    lang: language(identify),
    ua: identify.userAgent(),
    host: settings.domain,
    ip: identify.ip()
  });
};

/**
 * Map `track`.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.track = function(track, settings){
  var props = prefixKeys(track.properties(), 'ce_');
  return extend(props, {
    timestamp: track.timestamp().getTime(),
    timeout: timeout(track, settings),
    ce_name: track.event(),
    host: settings.domain,
    cookie: cookie(track),
    lang: language(track),
    ua: track.userAgent(),
    ip: track.ip()
  });
};

/**
 * Create a cookie.
 *
 * @param {Facade} message
 * @return {String}
 * @api private
 */

function cookie(message){
  return crypto
    .createHash('md5')
    .update(message.userId() || message.sessionId())
    .digest('hex');
}

/**
 * Get timeout.
 *
 * @param {Facade} message
 * @param {Obejct} settings
 * @return {Number}
 * @api private
 */

function timeout(message, settings){
  return message.proxy('options.timeout')
    || settings.timeout
    || 30;
}

/**
 * Language.
 *
 * @param {Facade} message
 * @return {String}
 * @api private
 */

function language(message){
  return message.proxy('traits.language')
    || message.proxy('options.language');
}

/**
 * Prefix keys of `obj` with `str`.
 *
 * @param {Object} obj
 * @param {String} str
 * @return {Object}
 * @api private
 */

function prefixKeys(obj, str){
  return Object.keys(obj).reduce(function(ret, key){
    ret[str + key] = obj[key];
    return ret;
  }, {});
}
