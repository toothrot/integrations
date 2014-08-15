
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var Batch = require('batch');
var is = require('is');

/**
 * CommandIQ special traits.
 */

var specialTraits =  [
  'android_push_registration_id',
  'urbanairship_ios_device_token',
  'urbanairship_android_apid',
  'ios_push_device_token'
];


/**
 * CommandIQ ignored traits.
 */

var ignored = [
  'userAgent',
  'created'
].concat(specialTraits);


/**
 * Expose `CommandIQ`
 */

var CommandIQ = module.exports = integration('CommandIQ')
  .endpoint('http://api.commandiq.com/api')
  .client()
  .server()
  .mobile()
  .retries(2);

/**
 * Validate the settings for the project (in this case, the apiKey)
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

CommandIQ.prototype.validate = function (message, settings) {
  return this.ensure(settings.apiKey, 'apiKey');
};

/**
 * Handles segment.io's identify method.
 *
 * Note: Traits that are not part of the CommandIQ identifyUser
 * method are instead passed to trackEvent.
 *
 * https://commandiq.com/docs/api
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

CommandIQ.prototype.identify = function (identify, settings, fn) {
  var userId = identify.userId() || identify.sessionId();
  var body = {};
  body.email = identify.email();
  body.key = settings.apiKey;
  body.user_id = userId;

  specialTraits.forEach(function(trait){
    var val = identify.proxy('traits.' + trait);
    if (val) body[trait] = val;
  });

  var batch = new Batch();
  var traits = identify.traits();
  var self = this;
  var events = [];

  Object.keys(traits).forEach(function(trait){
    var value = traits[trait];
    if (ignored.indexOf(trait) > -1) return;

    events.push({
      value: value,
      key: trait
    });
  });

  batch.push(function(done){
    self._track(userId, events, settings, done);
  });

  batch.push(function(done) {
    self
      .post('/identifyUser/segmentio')
      .type('json')
      .send(body)
      .end(self.handle(done));
  });

  batch.end(fn);
};


/**
 * Handles segment.io's track method.
 *
 * Note: Sends each property as an individual request to CommandIQ's trackEvent method.
 * https://commandiq.com/docs/api
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} callback
 * @api public
 */

CommandIQ.prototype.track = function (track, settings, fn) {
  var userId = track.userId() || track.sessionId();
  var properties = track.properties();
  var delimiter = ':';
  var event = track.event();
  var events = Object.keys(properties).map(function(key){
    return {
      key: event + delimiter +  key,
      value: properties[key]
    };
  });

  this._track(userId, events, settings, fn);
};

/**
 * Sends a single trackEvent request to CommandIQ.
 *
 * @param {String} userId
 * @param {Array[Object]} events
 * @param {Object} settings
 * @param {Function} fn
 * @api private
 */

CommandIQ.prototype._track = function(userId, events, settings, fn){
  events = filterEvents(events);
  if (!events.length) return fn();

  var eventList = events.map(function(event){
    return {
      event_value: event.value,
      event_type: event.type,
      event_key: event.key,
      user_id: userId
    };
  });

  this
    .post('/trackEventList/segmentio')
    .type('json')
    .send({ key: settings.apiKey })
    .send({ event_list: eventList })
    .end(this.handle(fn));
};

/**
 * Special CommandIQ type function
 *
 * @param {Mixed} value
 * @return {String}
 * @api private
 */

function type(val){
  var type = typeof val;
  if (type === 'boolean') return 'bool';
  if (type === 'string') return 'str';
  if (type === 'number') {
    // If the number isn't an integer, send it as a string.
    if (val % 1 === 0) return 'int';
    else return 'str';
  }
}

/**
 * Converts any date values to isostrings and sets the type on all events.
 * Then filters for only events ith a given type
 *
 * `events`:
 *
 *   - {String} key
 *   - {Mixed} value
 *
 * returns:
 *
 *   - {String} type
 *   - {String} key
 *   - {Mixed} value
 *
 * @param {Array[Object]} events
 * @return {Array[Object]}
 */

function filterEvents(events){
  events = events.map(function(event){
    var value = event.value;
    if (is.date(value)) value = value.toISOString();
    return {
      type: type(value),
      key: event.key,
      value: value
    };
  });

  return events.filter(function(event){ return event.type; });
}
