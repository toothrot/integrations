var debug    = require('debug')('Segmentio:Outbound')
  , Provider = require('../provider')
  , request  = require('request-retry')({ retries : 2 })
  , util     = require('util');


module.exports = Outbound;


function Outbound () {
  Provider.call(this);
  this.name = 'Outbound';
  this.baseUrl = 'http://api.outbound.io/api/v1';
}


util.inherits(Outbound, Provider);


Outbound.prototype.enabled = function (message, settings) {
  return message.channel() === 'server';
};


Outbound.prototype.validate = function (message, settings) {
  return this._missingSetting(settings, 'apiKey');
};


/**
 * Make an Outbound track request
 * https://outbound.uservoice.com/knowledgebase/articles/210394-how-to-track-your-events
 */

Outbound.prototype.track = function (track, settings, callback) {

  var body = {
    api_key : settings.apiKey,
    user_id : track.userId() || track.sessionId(),
    event   : track.event(),
    payload : track.properties()
  };

  var req = {
    url  : this.baseUrl + '/track',
    json : body
  };

  debug('making track request');
  request.post(req, this._handleResponse(callback));
};


/**
 * Make an Outbound identify request
 * https://outbound.uservoice.com/knowledgebase/articles/210384-how-to-identify-your-users
 */

Outbound.prototype.identify = function (identify, settings, callback) {

  var body = {
    api_key : settings.apiKey,
    user_id : identify.userId() || identify.sessionId(),
    traits  : identify.traits()
  };

  var req = {
    url  : this.baseUrl + '/identify',
    json : body
  };

  debug('making identify request');
  request.post(req, this._handleResponse(callback));
};