
var Classic   = require('./classic')
  , errors    = require('../errors')
  , is        = require('is')
  , Universal = require('./universal')
  , util      = require('util');


module.exports = GoogleAnalytics;


function GoogleAnalytics () {
  this.name      = 'Google Analytics';
  this.classic   = new Classic();
  this.universal = new Universal();
}


GoogleAnalytics.prototype.enabled = function (message, settings) {
  return message.channel() === 'server';
};


GoogleAnalytics.prototype.validate = function(message, settings) {
  return this._validateSetting(settings, 'serversideTrackingId');
};


GoogleAnalytics.prototype.track    = proxy('track');
GoogleAnalytics.prototype.identify = proxy('identify');
GoogleAnalytics.prototype.alias    = proxy('alias');


/**
 * Proxy the method to classic or universal analytics.
 * @param  {[type]} method [description]
 * @return {[type]}        [description]
 */
function proxy (method) {
  return function (message, settings) {
    var ga = settings.universal ? this.universal : this.classic;
    return ga[method].apply(ga, arguments);
  };
}
