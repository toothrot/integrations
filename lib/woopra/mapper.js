
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
    host: settings.domain,
    cookie: cookie(identify),
    ip: identify.ip(),
    timeout: timeout(identify, settings),
    cv_name: identify.name(),
    cv_company: identify.proxy('traits.company'),
    lang: language(identify),
    ua: identify.userAgent()
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
    host: settings.domain,
    cookie: cookie(track),
    ip: track.ip(),
    timeout: timeout(track, settings),
    ce_name: track.event(),
    lang: language(track),
    ua: track.userAgent()
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
