
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var Universal = require('./universal');
var Classic = require('./classic');

/**
 * Expose `GA`
 */

var GA = module.exports = integration('Google Analytics');

/**
 * Initialize
 *
 * @api private
 */

GA.prototype.initialize = function(){
  this.classic = new Classic;
  this.universal = new Universal;
};

/**
 * Enabled?
 * 
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Boolean}
 * @api private
 */

GA.prototype.enabled = function(msg, settings){
  return !! (msg.enabled(this.name) 
    && 'server' == msg.channel()
    && settings.serversideTrackingId);
};

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

GA.prototype.validate = function(message, settings) {
  return this.ensure(settings.serversideTrackingId, 'serversideTrackingId');
};

/**
 * Methods
 */

GA.prototype.track    = proxy('track');
GA.prototype.identify = proxy('identify');
GA.prototype.alias    = proxy('alias');
GA.prototype.page     = proxy('page');

/**
 * Expose _pageview so that our middleware can call _pageview
 */

GA.prototype._pageview = function (track, settings, callback) {
  if (!settings.serversideClassic) return process.nextTick(callback);
  this.classic.page(track, settings, callback);
};

/**
 * Proxy the method to classic or universal analytics.
 * @param  {String}   method  ('track', 'identify', etc.)
 * @return {Function}         the function to use
 */

function proxy (method) {
  return function (message, settings) {
    var ga = settings.serversideClassic ? this.classic: this.universal;
    return ga[method].apply(ga, arguments);
  };
}
