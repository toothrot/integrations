
var debug  = require('debug')('Segmentio:Integration')
  , errors = require('./errors')
  , is     = require('is')
  , util   = require('util');


module.exports = Integration;


function Integration () {
  this.name = 'Integration';
}


Integration.enabled = function (message, settings) {
  return message.enabled(this.name);
};


Integration.prototype.identify = function (identify, settings, callback) {
  process.nextTick(callback);
};


Integration.prototype.track = function (track, settings, callback) {
  process.nextTick(callback);
};


Integration.prototype.alias = function (alias, settings, callback) {
  process.nextTick(callback);
};


Integration.prototype._handleResponse = function (callback) {
  var self = this;
  return function (err, res, body) {
    if (err) return callback(err);

    var status = res.statusCode;
    if (status === 200 || status === 201) return callback(null, body);

    var message = util.format('Failed %s request: %s', self.name, status);
    debug('%s %s', message, body);
    err = new errors.BadRequest(message, status, body);
    return callback(err);
  };
};


Integration.prototype._missingSetting = function (settings, key) {

  if (!is.string(settings[key]) || is.empty(settings[key])) {
    var msg = util.format('%s integration requires "%s" setting', this.name,
                            key);
    return new errors.Validation(msg);
  }
};