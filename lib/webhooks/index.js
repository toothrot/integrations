

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


WebhookIntegration.prototype.identify = makeRequest;
WebhookIntegration.prototype.track    = makeRequest;
WebhookIntegration.prototype.alias    = makeRequest;


/**
 * Actually make a request
 * @param  {Object}   message   the identify or track call
 * @param  {Object}   settings  the webhook settings
 * @param  {Function} callback  (err)
 */
function makeRequest (message, settings, callback) {
  var req = createRequest(message, settings);

  request.post(req, function (err, res, body) {
    if (err) return callback(err);
    if (res.statusCode === 200) return callback(null, body);

    err = new errors.BadRequest('Failed webhook request',
                                 res.statusCode,
                                 body);
    callback(err);
  });
}


/**
 * Create a request options object from our data
 * @param  {Object} message   the identify or track call
 * @param  {Object} settings  the webhook settings
 * @return {Object} request   the options to pass to request.
 */
function createRequest (message, settings) {

  var url = settings.globalHook;

  // delete attributes we don't want them using
  delete message.context;
  delete message.projectId;

  return {
    url     : url,
    json    : message,
    headers : {
      'User-Agent': 'Segment.io/0.1.0'
    }
  };
}



