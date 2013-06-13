

var errors  = require('../errors')
  , is      = require('is')
  , request = require('request-retry')({ retries: 0 });


module.exports = WebhookProvider;


function WebhookProvider () {
  this.name = 'Webhook';
}


WebhookProvider.prototype.enabled = function (message, settings) {
  return true; // webhooks should send everything.
};


WebhookProvider.prototype.validate = function (message, settings) {
  var url = settings.globalHook;
  if (is.string(url) && !is.empty(url)) return;

  var msg = "Webhooks requires the 'globalHook' setting.";
  return new errors.ValidationError(msg);
};


WebhookProvider.prototype._request = function (message, settings, callback) {
  var req = this._createRequest(message, settings);

  request.post(req, function (err, res, body) {
    if (err) return callback(err);
    if (res.statusCode === 200) return callback();

    err = new errors.BadRequestError('Failed webhook request',
                                     res.statusCode,
                                     body);
    callback(err);
  });
};


WebhookProvider.prototype._createRequest = function (data, settings) {

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


WebhookProvider.prototype.identify = WebhookProvider.prototype._request;
WebhookProvider.prototype.track    = WebhookProvider.prototype._request;
WebhookProvider.prototype.alias    = WebhookProvider.prototype._request;
