/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');

var traverse = require('isodate-traverse');
var floor = require('date-math').day.floor;
var convert = require('convert-dates');
var isostring = require('isostring');
var fmt = require('util').format;
var Cache = require('lru-cache');
var extend = require('extend');
var ms = require('ms');
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
    //TODO: Replace with Getamity.com URLs.
    this.identifyUrl = 'http://localhost:8000/rest/v1/activities/identify_participant',
    this.groupUrl = 'http://localhost:8000/rest/v1/activities/identify_account',
    this.trackUrl = 'http://localhost:8000/rest/v1/activities/record';
};

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

    participant = {
        participant_id: identify.userId(),
        workspace_id: settings.workspace_id,
        source_id: settings.external_id_source,
        created_at: identify.created(),
        full_name: identify.proxy('traits.full_name'),
        email: identify.email(),
        avatar_url: identify.avatar(),
        gender: identify.proxy('traits.gender'),
        birthday: idenfity.proxy('traits.birthday'),
        address: identify.address(),
        telephone: identify.proxy('traits.telephone'),
        url: identify.proxy('traits.url')
    };

    this.post(this.identifyUrl)
        .auth(settings.client_id, client_secret)
        .type('json')
        .send(participant)
        .end(function (err, res) {
            if (err) return callback(err);
            if (res.ok) return callback(null, res);
            var errors = res.body.errors || [
                {}
            ];
            var msg = errors[0].message;
            var status = res.status;
            var body = res.body;

            callback(new errors.BadRequest('Bad Amity request "' + msg + '".', status, body));
        });
};

Amity.prototype.group = function(group, settings, callback) {
    account = {
        workspace_id: settings.workspace_id,
        source_id: settings.external_id_source,
        participant_id: group.userId(),
        account_id: group.groupId(),
        created_at: identify.created(),
        name: identify.name(),
        description: identify.description(),
        industry: indentify.industry(),
        avatar_url: identify.avatar(),
        address: identify.address(),
        telephone: identify.proxy('traits.telephone'),
        url: identify.proxy('traits.url'),
        participant_id_source: settings.external_id_source
    };

    this.post(this.groupUrl)
        .auth(settings.client_id, client_secret)
        .type('json')
        .send(account)
        .end(function (err, res) {
            if (err) return callback(err);
            if (res.ok) return callback(null, res);
            var errors = res.body.errors || [
                {}
            ];
            var msg = errors[0].message;
            var status = res.status;
            var body = res.body;

            callback(new errors.BadRequest('Bad Amity request "' + msg + '".', status, body));
        });
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
    var payload = {
        workspace_id: settings.workspace_id,
        name: track.name(),
        created_at: track.createdAt(),
        participant_id: track.proxy('properties.participant_id'),
        account_id: track.proxy('properties.account_id'),
        participant_id_source: settings.external_id_source,
        account_id_source: settings.external_id_source,
        properties: track.properties()
    };

    this.post(this.trackUrl)
        .auth(settings.client_id, client_secret)
        .type('json')
        .send(payload)
        .end(function (err, res) {
            if (err) return callback(err);
            if (res.ok) return callback(null, res);
            var errors = res.body.errors || [
                {}
            ];
            var msg = errors[0].message;
            var status = res.status;
            var body = res.body;

            callback(new errors.BadRequest('Bad Amity request "' + msg + '".', status, body));
        });

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
        && this.ensure(settings.client_id, 'client-id')
        && this.ensure(settings.client_secret, 'client-secret')
        && this.ensure(settings.external_id_source, 'external-id-source');
};

