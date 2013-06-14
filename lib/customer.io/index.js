
var clone   = require('clone')
  , errors  = require('../errors')
  , is      = require('is')
  , request = require('request-retry')({ retries : 2 })
  , util    = require('util');


function CustomerIOIntegration () {
  this.name = 'Customer.io';
}


CustomerIOIntegration.prototype.enabled = function (message, settings) {
  return message.channel === 'server';
};


CustomerIOIntegration.prototype.validate = function (message, settings) {

  function check (key) {
    var val = settings[key];
    if (!is.string(val) || is.empty(val)) {
      var msg = util.format('Customer.io requires "%s" setting.', key);
      return new errors.Validation(msg);
    }
  }

  var err = check('siteId') ||
            check('apiKey');

  return err;
};


CustomerIOIntegration.prototype.track = function (message, settings, callback) {

  var id     = message.userId || message.sessionId
    , traits = message.traits
    , json   = clone(traits || {});

  if (json.created) {
    json.created_at = created.getTime() / 1000;
    delete json.created;
  }

  var req = {
    url     : this._trackUrl(id),
    json    : json,
    headers : reqHeaders(settings)
  };

  request.put(req, onResponse(callback));
};


CustomerIOIntegration.prototype.identify = function (message, settings, callback) {

  var id = message.userId || message.sessionId;
};


CustomerIOIntegration.prototype._trackUrl = function (visitorId) {
  return 'https://app.customer.io/api/v1/customers/' + visitorId + '/events';
};


CustomerIOIntegration.prototype._identifyUrl = function (visitorId) {
  return 'https://app.customer.io/api/v1/customers/' + visitorId;
};



function reqHeaders (settings) {
  var auth = 'Basic ' + settings.siteId + ':' + settings.apiKey;
  return {
    'Authorization' : new Buffer(auth).toString('base64')
  };
}


function onResponse (callback) {
  return function (err, res, body) {
    if (err) return callback(err);
    if (res.statusCode === 200) return callback(null, body);

    err = new errors.BadRequest('Failed Customer.io request',
                                 res.statusCode,
                                 body);
    return callback(err);
  };
}



