
/**
 * Module dependencies.
 */

var convert = require('convert-dates');
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
    if (created) traits.created_at = time(created);
    if (identify.email()) traits.email = identify.email();
    object.del(traits, 'created');
    traits = convert(traits, time);
    self
      .put(identify.userId())
      .auth(settings.siteId, settings.apiKey)
      .type('json')
      .send(traits)
      .end(self.handle(fn));
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

  Object.keys(traits).forEach(function(key){
    mapped['Group ' + key] = traits[key];
  });

  mapped['Group id'] = group.groupId();
  mapped = convert(mapped, time);
  json.traits = mapped;
  json.userId = group.userId();
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
    var properties = convert(track.properties(), time);
    self
      .post(track.userId() + '/events')
      .auth(settings.siteId, settings.apiKey)
      .send({ timestamp: time(track.timestamp()) })
      .send({ data: properties })
      .send({ name: track.event() })
      .type('json')
      .end(self.handle(fn));
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
  this
    .put(message.userId())
    .auth(settings.siteId, settings.apiKey)
    .send({ _last_visit: time(message.timestamp()) })
    .type('json')
    .end(this.handle(fn));
};
