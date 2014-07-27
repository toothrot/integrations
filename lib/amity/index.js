/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Amity`
 *
 * http://api-docs.getamity.com/
 */

var Amity = module.exports = integration('Amity')
  .endpoint('https://app.getamity.com/rest/v1/activities')
  .mapper(mapper)
  .client()
  .mobile()
  .server()
  .retries(2);

/**
 * Identify a user by creating or updating their account in Amity, filtering
 * out traits which are not created in the Amity interface.
 *
 * http://api-docs.getamity.com/
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} callback
 * @api public
 */

Amity.prototype.identify = send('/identify_participant');




Amity.prototype.group = send('/identify_account');

/**
 * Records a Amity event,
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} callback
 * @api public
 */

Amity.prototype.track = send('/record');

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

Amity.prototype.validate = function (message, settings) {
  return this.ensure(settings.workspaceId, 'workspaceId')
    || this.ensure(settings.clientId, 'clientId')
    || this.ensure(settings.clientSecret, 'clientSecret');
};


function send(path){
  return function(payload, settings, fn){
    this.post(path)
      .auth(settings.clientId, settings.clientSecret)
      .type('json')
      .send(payload)
      .end(this.handle(fn));
  };
}