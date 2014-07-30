
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var errors = integration.errors;
var is = require('is');

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

HelpScout.prototype.identify = function (identify, settings, callback) {
  var email = identify.email()
  var self  = this;
  this._getUser({ email : email }, settings, function (err, user) {
    if (err) return callback(err);
    if (!user) self._createUser(identify, settings, callback);
    else self._updateUser(user.id, identify, settings, callback);
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

HelpScout.prototype._getUser = function (filter, settings, callback) {
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
 * Updates the user in HelpScout with the new identify
 *
 * @param  {String}   id        the HelpScout id
 * @param  {Facade}   identify
 * @param  {Object}   settings
 * @param  {Function} callback  (err, user)
 * @api private
 */

HelpScout.prototype._updateUser = function (id, identify, settings, callback) {
  return this
    .put('/customers/' + id + '.json')
    .auth(settings.apiKey, 'X')
    .query({ reload: true })
    .type('json')
    .send(formatTraits(identify))
    .end(this.handle(callback));
};

/**
 * Creates a user in HelpScout
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

HelpScout.prototype._createUser = function (identify, settings, callback) {
  return this
    .post('/customers.json')
    .auth(settings.apiKey, 'X')
    .query({ reload: true })
    .type('json')
    .send(formatTraits(identify))
    .end(this.handle(callback));
};

/**
 * Add the HelpScout traits
 *
 * http://developer.helpscout.net/customers/update/
 *
 * TODO:
 *
 *    - msg.companies('.name')[0] == .organization / .company / .companies[0].name
 *    - msg.gender()
 *    - msg.age() == .age / .birthdate / .birthday
 *    - msg.location()
 *    - msg.avatar()
 *    - msg.jobTitle()
 *    - msg.background() == .background / .description
 *    - msg.websites() == [.website] +/ .websites
 *    - msg.phones() == [.phone] ^ .phones
 *
 * @param  {Facade.Identify} identify
 * @return {Object}
 * @api private
 */

function formatTraits (identify) {
  var organization = identify.proxy('traits.organization') ||
                     identify.proxy('traits.company');

  var traits = clean({
    gender       : identify.proxy('traits.gender'),
    age          : identify.proxy('traits.age'),
    location     : identify.proxy('traits.location'),
    photoUrl     : identify.proxy('traits.avatar') || identify.proxy('traits.photoUrl'),
    firstName    : identify.firstName(),
    lastName     : identify.lastName(),
    emails       : [{ value : identify.email() }],
    organization : organization,
    jobTitle     : identify.proxy('traits.jobTitle'),
    background   : identify.proxy('traits.background'),
    address      : formatAddress(identify),
    websites     : formatMultiple(identify, 'website', 'websites'),
    phones       : formatPhones(identify)
  });

  return traits;
}

/**
 * Look in the traits for the singular and plural field for an event
 *
 * @param {Identify} identify
 * @param {String}   singular  the singular string
 * @param {String}   plural
 * @return {Array}
 * @api private
 */

function formatMultiple (identify, singular, plural) {
  singular = identify.proxy('traits.' + singular);
  plural   = identify.proxy('traits.' + plural);

  if (singular) return [formatData(singular)];
  if (plural && is.array(plural)) return plural.map(formatData);
}

/**
 * Add location data to each item in the phones array
 *
 * @param {Identify} identify
 * @return {Array}
 * @api private
 */

function formatPhones (identify) {
  var phones = formatMultiple(identify, 'phone', 'phones');
  if (!phones) return;
  if (!is.array(phones)) phones = [phones];

  phones.forEach(function (phone) {
    if (!phone.location) phone.location = 'mobile';
  });

  return phones;
}

/**
 * Formats an address for helpscout
 *
 * @param {Identify} identify
 * @return {Object}
 * @api private
 */

function formatAddress (identify) {
  var address = identify.proxy('traits.address')
    , proxy   = 'traits';

  // Decide whether to reach into just traits or traits.address
  if (is.object(address)) proxy = 'traits.address';

  var zip     = identify.proxy(proxy + '.zip') || identify.proxy(proxy + '.postalCode')
    , city    = identify.proxy(proxy + '.city')
    , country = identify.proxy(proxy + '.country')
    , state   = identify.proxy(proxy + '.state')
    , street  = identify.proxy(proxy + '.street');

  if (!zip || !city || !country || !state || !street) return;

  var output = {
    city       : city,
    state      : state,
    postalCode : zip,
    country    : country,
    lines      : [street]
  };

  return output;
}

/**
 * Formats an array field for HelpScout
 *
 * http://developer.helpscout.net/customers/update/
 *
 * @param {Array} data
 * @return {Object}
 * @api private
 */

function formatData (data) {
  return {
    value : data
  };
}

/**
 * Clean undefined.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function clean(obj){
  for (var k in obj) {
    if (null == obj[k]) {
      delete obj[k];
    }
  }

  return obj;
}
