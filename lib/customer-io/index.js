
var clone   = require('clone')
  , errors  = require('../errors')
  , is      = require('is')
  , request = require('request-retry')({ retries : 2 })
  , util    = require('util');


module.exports = CustomerIO;


function CustomerIO () {
  this.name = 'Customer.io';
}


CustomerIO.prototype.enabled = function (message, settings) {
  return message.channel === 'server';
};


CustomerIO.prototype.validate = function (message, settings) {

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


CustomerIO.prototype.identify = function (message, settings, callback) {

  var id     = message.userId || message.sessionId
    , traits = clone(message.traits || {});

  if (traits.created) {
    traits.created_at = Math.floor(traits.created.getTime() / 1000);
    delete traits.created;
  }

  var req = {
    url     : this._identifyUrl(id),
    json    : traits,
    headers : reqHeaders(settings)
  };

  request.put(req, onResponse(callback));
};


CustomerIO.prototype.track = function (message, settings, callback) {

  var id         = message.userId || message.sessionId
    , properties = clone(message.properties || {});

  var json = {
    name      : message.event,
    data      : properties,
    timestamp : Math.floor(message.timestamp.getTime() / 1000)
  };

  var req = {
    url     : this._trackUrl(id),
    json    : json,
    headers : reqHeaders(settings)
  };

  request.post(req, onResponse(callback));
};


CustomerIO.prototype.alias = function (message, settings, callback) {
  process.nextTick(function () { callback(); });
};


CustomerIO.prototype._trackUrl = function (visitorId) {
  return 'https://app.customer.io/api/v1/customers/' + visitorId + '/events';
};


CustomerIO.prototype._identifyUrl = function (visitorId) {
  return 'https://app.customer.io/api/v1/customers/' + visitorId;
};



function reqHeaders (settings) {
  var auth = settings.siteId + ':' + settings.apiKey;
  return {
    'Authorization' : 'Basic ' + new Buffer(auth).toString('base64')
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



