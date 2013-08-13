
var debug       = require('debug')('Segmentio:Webhooks')
  , is          = require('is')
  , Integration = require('segmentio-integration')
  , request     = require('request-retry')({ retries: 0 })
  , url         = require('url')
  , util        = require('util');


var errors = Integration.errors;


module.exports = Webhooks;


function Webhooks () {
  this.name = 'Webhooks';
}


util.inherits(Webhooks, Integration);


/**
 * Webhooks should send on everything.
 */

Webhooks.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) ||
         message.channel() === 'server';
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
  var req  = createRequest(message, settings);

  debug('making request');
  request.post(req, this._handleResponse(callback));
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
  json.options = json.options || json.context;
  delete json.context;
  delete json.projectId;

  return {
    url     : url,
    json    : json,
    headers : {
      'User-Agent': 'Segment.io/1.0.0'
    }
  };
}