
var debug       = require('debug')('Segmentio:HelpScout')
  , errors      = require('../errors')
  , Integration = require('../integration')
  , is          = require('is')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util');


module.exports = HelpScout;


function HelpScout () {
  this.name    = 'HelpScout';
  this.baseUrl = 'https://api.helpscout.net/v1/';
}


util.inherits(HelpScout, Integration);


HelpScout.prototype.enabled = function (message, settings) {
  return Integration.enabled.call(this, message, settings) &&
         message.channel() === 'server';
};


HelpScout.prototype.validate = function (message, settings) {
  var err = this._missingSetting(settings, 'apiKey');
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
 */

HelpScout.prototype.identify = function (identify, settings, callback) {
  var email = identify.email()
    , self  = this;

  debug('making identify request');
  this._getUser({ email : email }, settings, function (err, user) {
    if (err) return callback(err);

    if (!user) self._createUser(identify, settings, callback);
    else self._updateUser(user.id, identify, settings, callback);
  });
};


/**
 * Get a user from the API, filtered by particular fields
 * @param  {Object}   filter   an object to match fields on
 * @param  {Object}   settings
 * @param  {Function} callback (err, user)
 */

HelpScout.prototype._getUser = function (filter, settings, callback) {

  var req = {
    url     : this.baseUrl + 'customers.json',
    headers : this._headers(settings),
    qs      : filter,
    json    : true
  };

  debug('getting user from the api');
  request.get(req, this._handleResponse(function (err, body) {
    if (err) return callback(err);

    var customer = body.items ? body.items[0] : null;
    callback(err, customer);
  }));
};


/**
 * Updates the user in HelpScout with the new identify
 * @param  {String}   id        the HelpScout id
 * @param  {Facade}   identify
 * @param  {Object}   settings
 * @param  {Function} callback  (err, user)
 */

HelpScout.prototype._updateUser = function (id, identify, settings, callback) {
  var traits = formatTraits(identify);

  var req = {
    url     : this.baseUrl + util.format('customers/%s.json', id),
    headers : this._headers(settings),
    json    : traits,
    qs      : { reload : true }
  };

  debug('updating an existing user');
  request.put(req, this._handleResponse(callback));
};


/**
 * Creates a user in HelpScout
 */

HelpScout.prototype._createUser = function (identify, settings, callback) {

  var traits = formatTraits(identify);

  var req = {
    url     : this.baseUrl + 'customers.json',
    headers : this._headers(settings),
    json    : traits,
    qs      : { reload : true }
  };

  debug('creating a new user');
  request.post(req, this._handleResponse(callback));
};


/**
 * Add the proper headers
 */

HelpScout.prototype._headers = function (settings) {

  var auth = 'Basic ' + new Buffer(settings.apiKey + ':X').toString('base64');
  return { 'Authorization' : auth };
};


/**
 * Add the HelpScout traits
 * http://developer.helpscout.net/customers/update/
 *
 * @param  {Facade.Identify} identify
 */

function formatTraits (identify) {
  var traits = {
    firstName    : identify.firstName(),
    lastName     : identify.lastName(),
    emails       : [{ value : identify.email() }],
    organization : identify.proxy('traits.organization'),
    jobTitle     : identify.proxy('traits.jobTitle'),
    background   : identify.proxy('traits.background'),
    websites     : formatMultiple(identify, 'website', 'websites'),
    addresses    : formatMultiple(identify, 'address', 'addresses'),
    phones       : formatMultiple(identify, 'phone',   'phones')
  };

  return traits;
}


/**
 * Look in the traits for the singular and plural field for an event
 *
 * @param {Identify} identify
 * @param {String}   singular  the singular string
 * @param {String}   plural
 */

function formatMultiple (identify, singular, plural) {
  singular = identify.proxy('traits.' + singular);
  plural   = identify.proxy('traits.' + plural);

  if (singular) return formatData(singular);
  if (plural && is.array(plural)) return plural.map(formatData);
}


/**
 * Formats an array field for HelpScout
 * http://developer.helpscout.net/customers/update/
 */

function formatData (data) {
  return {
    value : data
  };
}

