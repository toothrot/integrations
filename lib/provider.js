
var errors = require('./errors')
  , util   = require('util');


module.exports = Provider;


function Provider () {
  this.name = 'Provider';
}


Provider.prototype.identify = function (identify, settings, callback) {
  process.nextTick(callback);
};


Provider.prototype.track = function (track, settings, callback) {
  process.nextTick(callback);
};


Provider.prototype.alias = function (alias, settings, callback) {
  process.nextTick(callback);
};


Provider.prototype._handleResponse = function (callback) {
  var self = this;
  return function (err, res, body) {
    if (err) return callback(err);

    var status = res.statusCode;
    if (status === 200 || status === 201) return callback(null, body);

    var message = util.format('Failed %s request', self.name);
    err = new errors.BadRequest(message, status, body);
    return callback(err);
  };
};


Provider.prototype._validationError = function (key) {
  var msg = util.format('%s integration requires "%s" setting', this.name, key);
  return new errors.Validation(msg);
};