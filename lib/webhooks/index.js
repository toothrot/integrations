

var errors   = require('../errors')
  , is       = require('is')
  , request  = require('request-retry')({ retries: 0 })
  , Provider = require('../provider')
  , url      = require('url')
  , util     = require('util');


module.exports = Webhooks;


function Webhooks () {
  this.name = 'Webhooks';
}


util.inherits(Webhooks, Provider);


Webhooks.prototype.enabled = function (message, settings) {
  return true; // webhooks should send everything.
};


Webhooks.prototype.validate = function (message, settings) {
  var err = this._missingSetting(settings, 'globalHook');
  if (err) return err;

  var hook   = settings.globalHook
    , parsed = url.parse(hook);

  if (!parsed.protocol || !parsed.host) {
    var msg = "Webhook 'globalHook' setting must be a valid url";
    return new errors.Validation(msg);
  }
};


Webhooks.prototype.identify = makeRequest;
Webhooks.prototype.track    = makeRequest;
Webhooks.prototype.alias    = makeRequest;


/**
 * Actually make a request
 * @param  {Object}   message   the identify or track call
 * @param  {Object}   settings  the webhook settings
 * @param  {Function} callback  (err)
 */
function makeRequest (message, settings, callback) {
  var req  = createRequest(message, settings)
    , self = this;

  request.post(req, self._handleResponse(callback));
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
  var json = message.json();
  delete json.context;
  delete json.projectId;

  return {
    url     : url,
    json    : json,
    headers : {
      'User-Agent': 'Segment.io/0.1.0'
    }
  };
}



