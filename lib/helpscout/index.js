
var errors   = require('../errors')
  , is       = require('is')
  , Provider = require('../provider')
  , request  = require('request-retry')({ retries : 2 })
  , util     = require('util');


module.exports = HelpScout;


function HelpScout () {
  this.name    = 'HelpScout';
  this.baseUrl = 'https://api.helpscout.net/v1/';
}


util.inherits(HelpScout, Provider);


HelpScout.prototype.enabled = function (message, settings) {
  return message.channel === 'server';
};


HelpScout.prototype.validate = function (message, settings) {
  if (!is.string(settings.apiKey) || is.empty(settings.apiKey)) {
    return new errors.Validation('HelpScout requires "apiKey" setting.');
  }

  if (message.action() === 'identify' && !message.email()) {
    return new errors.Validation('HelpScout identify requires email field.');
  }
};


HelpScout.prototype.identify = function (message, settings, callback) {
  var email = message.email()
    , self  = this;

  this._getByEmail(email, function (err, user) {
    if (err) return callback(err);

    if (!user) self._createUser(message, settings, callback);
    else self._updateUser(user.id, message, settings, callback);
  });
};




HelpScout.prototype._getByEmail = function (email, apiKey, callback) {

  var req = {
    url     : this.baseUrl + 'customers.json?email=' + email,
    headers : this._headers({}, { apiKey : apiKey })
  };

  request.get(req, this._handleResponse(function (err, body) {
    if (err) return callback(err);

    try {
      body = JSON.parse(body);
    } catch (err) {
      return callback(err);
    }

    var customer = body.items ? body.items[0] : null;
    callback(err, customer);
  }));
};


HelpScout.prototype._updateUser = function (id, message, settings, callback) {
  var traits = message.traits();

  var req = {
    url     : this.baseUrl + util.format('customers/%s.json', id),
    headers : this._headers(settings),
    json    : traits
  };

  request.put(req, this._handleResponse(callback));
};


HelpScout.prototype._createUser = function (message, settings, callback) {
  var traits = message.traits();
  traits.email = message.email(); // email is required for helpscout

  var req = {
    url     : this.baseUrl + 'customers.json',
    headers : this._headers(settings),
    json    : traits
  };

  request.post(req, this._handleResponse(callback));
};



HelpScout.prototype._headers = function (settings) {

  var auth = 'Basic ' + new Buffer(settings.apiKey + ':X').toString('base64');
  return { 'Authorization' : auth };
};
