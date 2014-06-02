/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');

var is = require('is');

/**
 * Expose `Amity`
 */

var Amity = module.exports = integration('Amity')
    .retries(2);

/**
 * Initialize.
 *
 * @api private
 */

Amity.prototype.initialize = function () {
    // Values for this.baseUrl:
    // For production: https://app.getamity.com
    // For testing: http://localhost:8000/
    this.baseUrl = 'https://app.getamity.com';
    this.identifyUrl = this.baseUrl + '/rest/v1/activities/identify_participant';
    this.groupUrl = this.baseUrl + '/rest/v1/activities/identify_account';
    this.trackUrl = this.baseUrl + '/rest/v1/activities/record';
};

/**
 * Clean all nested objects and arrays.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

var clean = exports._clean = function(obj){
  var ret = {};

  // Flatten nested hierarchy, preserving arrays
  obj = flatten(obj);

  // Discard nulls, represent arrays as comma-separated strings
  Object.keys(obj).forEach(function(key){
    var val = obj[key];
    if (null == val) return;
    if (is.array(val)) val = val.toString();
    ret[key] = val;
  });

  return ret;
}

/**
 * Flatten a nested object into a single level space-delimited
 * hierarchy.
 *
 * Based on https://github.com/hughsk/flat
 *
 * @param {Object} source
 * @return {Object}
 * @api private
 */

function flatten(source){
  var output = {};

  function step(object, prev) {
    for (var key in object) {
      var value = object[key];
      var newKey = prev ? prev + ' ' + key : key;
      if (!is.array(value) && is.object(value)) return step(value, newKey);
      output[newKey] = value;
    }
  }
  step(source);
  return output;
}

/**
 * Identify a user by creating or updating their account in Amity, filtering
 * out traits which are not created in the Amity interface.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} callback
 * @api public
 */

Amity.prototype.identify = function (identify, settings, callback) {
    settings.external_id_source = settings.external_id_source || 'ctp.app';
    var participant = {
        participant_id: identify.userId(),
        workspace_id: settings.workspace_id,
        participant_id_source: settings.external_id_source,
        created_at: identify.created(),
        full_name: identify.proxy('traits.full_name'),
        email: identify.email(),
        avatar_url: identify.avatar(),
        gender: identify.proxy('traits.gender'),
        birthday: identify.proxy('traits.birthday'),
        address: identify.address(),
        telephone: identify.proxy('traits.telephone'),
        url: identify.proxy('traits.url')
    };
    participant = clean(participant);

    this.post(this.identifyUrl)
        .auth(settings.client_id, settings.client_secret)
        .type('json')
        .send(participant)
        .end(this.handle(callback));
};

Amity.prototype.group = function(group, settings, callback) {
    settings.external_id_source = settings.external_id_source || 'ctp.app';
    var account = {
        workspace_id: settings.workspace_id,
        account_id_source: settings.external_id_source,
        participant_id: group.userId(),
        account_id: group.groupId(),
        created_at: group.created(),
        name: group.proxy('traits.name'),
        avatar_url: group.proxy('traits.avatar_url'),
        address: group.proxy('traits.address'),
        telephone: group.proxy('traits.telephone'),
        url: group.proxy('traits.url'),
        participant_id_source: settings.external_id_source
    };

    account = clean(account);

    this.post(this.groupUrl)
        .auth(settings.client_id, settings.client_secret)
        .type('json')
        .send(account)
        .end(this.handle(callback));
};

/**
 * Records a Amity event,
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} callback
 * @api public
 */

Amity.prototype.track = function (track, settings, callback) {
    settings.external_id_source = settings.external_id_source || 'ctp.app';
    var payload = {
        workspace_id: settings.workspace_id,
        name: track.event(),
        participant_id: track.userId(),
        participant_id_source: settings.external_id_source,
        properties: clean(track.properties())
    };
    this.post(this.trackUrl)
        .auth(settings.client_id, settings.client_secret)
        .type('json')
        .send(payload)
        .end(this.handle(callback));

};

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

Amity.prototype.validate = function (message, settings) {
    return this.ensure(settings.workspace_id, 'workspace_id')
        || this.ensure(settings.client_id, 'client_id')
        || this.ensure(settings.client_secret, 'client_secret');
};

