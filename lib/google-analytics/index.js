
var Classic   = require('./classic')
  , Universal = require('./universal');


module.exports = GoogleAnalytics;


function GoogleAnalytics () {
  this.name      = 'Google Analytics';
  this.classic   = new Classic();
  this.universal = new Universal();
}


GoogleAnalytics.prototype.enabled  = proxy('enabled');
GoogleAnalytics.prototype.validate = proxy('validate');
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
