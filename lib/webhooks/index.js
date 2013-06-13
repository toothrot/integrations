

var errors  = require('../errors')
  , is      = require('is')
  , request = require('request-retry')({ retries: 0 })
  , url     = require('url');


module.exports = WebhookIntegration;


function WebhookIntegration () {
  this.name = 'Webhooks';
}


WebhookIntegration.prototype.enabled = function (message, settings) {
  return true; // webhooks should send everything.
};


WebhookIntegration.prototype.validate = function (message, settings) {
  var hook = settings.globalHook
    , msg;

  if (!is.string(hook)) {
    msg = "Webhooks requires the 'globalHook' setting to be a string.";
    return new errors.Validation(msg);
  }

  var parsed = url.parse(hook);
  if (!parsed.protocol || !parsed.host) {
    msg = "Webhook 'globalHook' setting must be a valid url";
    return new errors.Validation(msg);
  }

  return;
};


WebhookIntegration.prototype._request = function (message, settings, callback) {
  var req = this._createRequest(message, settings);

  request.post(req, function (err, res, body) {
    if (err) return callback(err);
    if (res.statusCode === 200) return callback();

    err = new errors.BadRequest('Failed webhook request',
                                 res.statusCode,
                                 body);
    callback(err);
  });
};


WebhookIntegration.prototype._createRequest = function (data, settings) {

  var url = settings.globalHook;

  // delete attributes we don't want them using
  delete data.context;
  delete data.projectId;

  return {
    url     : url,
    json    : data,
    headers : {
      'User-Agent': 'Segment.io/0.1.0'
    }
  };
};


WebhookIntegration.prototype.identify = WebhookIntegration.prototype._request;
WebhookIntegration.prototype.track    = WebhookIntegration.prototype._request;
WebhookIntegration.prototype.alias    = WebhookIntegration.prototype._request;
