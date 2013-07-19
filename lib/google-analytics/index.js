
var Classic   = require('./classic')
  , errors    = require('../errors')
  , Provider  = require('../Provider')
  , Universal = require('./universal')
  , util      = require('util');


module.exports = GoogleAnalytics;


function GoogleAnalytics () {
  this.name      = 'Google Analytics';
  this.classic   = new Classic();
  this.universal = new Universal();
}


util.inherits(GoogleAnalytics, Provider);


GoogleAnalytics.prototype.enabled = function (message, settings) {
  return Provider.enabled.call(this, message, settings) &&
         message.channel() === 'server';
};


GoogleAnalytics.prototype.validate = function(message, settings) {
  return this._missingSetting(settings, 'serversideTrackingId');
};


GoogleAnalytics.prototype.track    = proxy('track');
GoogleAnalytics.prototype.identify = proxy('identify');
GoogleAnalytics.prototype.alias    = proxy('alias');


/**
 * Proxy the method to classic or universal analytics.
 * @param  {String}   method  ('track', 'identify', etc.)
 * @return {Function}         the function to use
 */
function proxy (method) {
  return function (message, settings) {
    var ga = settings.universal ? this.universal : this.classic;
    return ga[method].apply(ga, arguments);
  };
}
