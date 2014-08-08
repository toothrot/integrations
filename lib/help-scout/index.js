
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var errors = integration.errors;
var mapper = require('./mapper');

/**
 * Expose `HelpScout`
 */

var HelpScout = module.exports = integration('Help Scout')
  .endpoint('https://api.helpscout.net/v1')
  .retries(2);

/**
 * Enabled.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @api public
 */

HelpScout.prototype.enabled = function (message, settings) {
  return message.enabled(this.name);
};

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @api public
 */

HelpScout.prototype.validate = function (message, settings) {
  var err = this.ensure(settings.apiKey, 'apiKey');
  if (err) return err;
  if (message.action() === 'identify' && !message.email()) {
    return new errors.Validation('HelpScout identify requires email field.');
  }
};

/**
 * Identifies a user in HelpScout. We first have to check whether a user
 * already exists for this email. If they don't, create them, otherwise
 * update them. TODO: fix race conditions with a shared lock.
 *
 * http://developer.helpscout.net/customers/create/
 * http://developer.helpscout.net/customers/update/
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

HelpScout.prototype.identify = function(identify, settings, callback){
  var email = identify.email()
  var self  = this;
  this._getUser({ email : email }, settings, function (err, user) {
    if (err) return callback(err);
    var payload = mapper.identify(identify);
    if (!user) self._createUser(payload, settings, callback);
    else self._updateUser(user.id, payload, settings, callback);
  });
};

/**
 * Get a user from the API, filtered by particular fields
 *
 * @param  {Object}   filter   an object to match fields on
 * @param  {Object}   settings
 * @param  {Function} callback (err, user)
 * @api private
 */

HelpScout.prototype._getUser = function(filter, settings, callback){
  return this
    .get('/customers.json')
    .auth(settings.apiKey, 'X')
    .query(filter)
    .end(this.handle(function(err, res){
      if (err) return callback(err);
      var items = res.body.items;
      callback(null, items && items[0]);
    }));
};

/**
 * Updates the user in HelpScout with the given `payload` and `id`.
 *
 * @param  {String}   id        the HelpScout id
 * @param  {Object}   payload
 * @param  {Object}   settings
 * @param  {Function} callback  (err, user)
 * @api private
 */

HelpScout.prototype._updateUser = function(id, payload, settings, callback){
  return this
    .put('/customers/' + id + '.json')
    .auth(settings.apiKey, 'X')
    .query({ reload: true })
    .type('json')
    .send(payload)
    .end(this.handle(callback));
};

/**
 * Creates a user in HelpScout with `payload`.
 *
 * @param {Object} payload
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

HelpScout.prototype._createUser = function(payload, settings, callback){
  return this
    .post('/customers.json')
    .auth(settings.apiKey, 'X')
    .query({ reload: true })
    .type('json')
    .send(payload)
    .end(this.handle(callback));
};
