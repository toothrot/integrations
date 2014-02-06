var debug       = require('debug')('segmentio:integrations:lytics')
  , Integration = require('segmentio-integration')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util');


module.exports = Lytics;


function Lytics () {
  this.name = 'Lytics';
  this.baseUrl = 'https://c.lytics.io/c';
}


util.inherits(Lytics, Integration);


Lytics.prototype.enabled = function (message, settings) {
  return Integration.enabled.apply(this, arguments) &&
         message.channel() === 'server';
};


Lytics.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'cid') ||
         this._missingSetting(settings, 'apiKey');
};


Lytics.prototype.identify = makeRequest;
Lytics.prototype.track    = makeRequest;
Lytics.prototype.alias    = makeRequest;


/**
 * Actually make a request
 * http://admin.lytics.io/doc/#segmentio
 * @param  {Object}   message   the identify or track call
 * @param  {Object}   settings  the lytics settings
 * @param  {Function} callback  (err)
 */

function makeRequest (message, settings, callback) {
  var json = message.json();

  json.options = json.options || json.context;
  delete json.context;
  delete json.projectId;

  var req = {
    url     : this.baseUrl + util.format('/%s/segmentio', settings.cid),
    json    : json,
    headers : { 'User-Agent' :'Segment.io/1.0.0' },
    qs      : { access_token : settings.apiKey }
  };

  debug('making request');
  request.post(req, this._handleResponse(callback));
}
