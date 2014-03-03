
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var Identify = require('segmentio-facade').Identify;
var object = require('obj-case');
var time = require('unix-time');

/**
 * Expose `CustomerIO`
 */

var CustomerIO = module.exports = integration('Customer.io')
  .endpoint('https://app.customer.io/api/v1/customers/')
  .retries(2);

/**
 * Enabled.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

CustomerIO.prototype.enabled = function(message, settings){
  return !! (message.enabled(this.name)
    && 'server' == message.channel()
    && message.field('userId'));
};

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

CustomerIO.prototype.validate = function(message, settings){
  return this.ensure(settings.siteId, 'siteId')
    || this.ensure(settings.apiKey, 'apiKey');
};

/**
 * Identify.
 *
 * http://customer.io/docs/api/rest.html#section-Creating_or_updating_customers
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

CustomerIO.prototype.identify = function(identify, settings, fn){
  var self = this;
  this.visit(identify, settings, function(){
    var traits = identify.traits();
    var created = identify.created();
    if (created) traits.created_at = created;
    object.del(traits, 'created');
    var req = self.put(identify.userId());
    req.auth(settings.siteId, settings.apiKey);
    req.type('json');
    req.send(traits);
    req.end(self.handle(fn));
  });
};

/**
 * Group.
 *
 * http://customer.io/docs/api/rest.html#section-Creating_or_updating_customers
 *
 * @param {Group} group
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

CustomerIO.prototype.group = function(group, settings, fn){
  var json = group.json();
  var traits = json.traits || {};
  var mapped = {};
  var email;

  if (email = group.proxy('traits.email')) {
    mapped.email = email;
    object.del(traits, 'email');
  }

  Object.keys(traits, function(key){
    mapped['Group ' + key] = traits[key];
  });

  json.userId = group.groupId();
  json.traits = mapped;
  this.identify(new Identify(json), settings, fn);
};

/**
 * Track.
 *
 * http://customer.io/docs/api/rest.html#section-Track_a_custom_event
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

CustomerIO.prototype.track = function(track, settings, fn){
  var self = this;
  this.visit(track, settings, function(err){
    if (err) return fn(err);
    var req = self.post(track.userId() + '/events');
    req.auth(settings.siteId, settings.apiKey);
    req.send({ timestamp: time(track.timestamp()) });
    req.send({ data: track.properties() });
    req.send({ name: track.event() });
    req.type('json');
    req.end(self.handle(fn));
  });
};

/**
 * Visit.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

CustomerIO.prototype.visit = function(message, settings, fn){
  if (!message.active()) return fn();
  var req = this.put(message.userId());
  req.auth(settings.siteId, settings.apiKey);
  req.send({ _last_visit: time(message.timestamp()) });
  req.type('json');
  req.end(this.handle(fn));
};

