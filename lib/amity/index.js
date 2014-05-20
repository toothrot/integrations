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
 * Initialize.  TODO: Change this.
 *
 * @api private
 */

Amity.prototype.initialize = function () {
    this.identifyUrl = '',  //TODO: fill these in.
    this.groupUrl = '',
    this.trackUrl = '';
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
        workspace_id: settings.workspace_id,
        source_id: settings.external_id_source,
        created_at: identify.created(),
        full_name: identify.proxy('traits.full_name'),
        email: identify.email(),
        avatar_url: identify.avatar(),
        gender: identify.proxy('traits.gender'),
        birthday: idenfity.proxy('traits.birthday'),
        address: identify.address(),
        phone: identify.proxy('traits.telephone'),
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

/**
 * Enabled.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

Amity.prototype.enabled = function (message, settings) {
    return message.enabled(this.name)
        && 'server' == message.channel()
        && message.email
        && message.email();
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
        _a: settings.portalId,
        _n: track.event(),
        _m: track.revenue(),
        email: track.email(),
    };

    var self = this
        , traits = convertDates(track.traits());

    // Also add user traits to Amity track requests for backwards compat
    // and to mimic their js library
    this._filterProperties(traits, settings, function (err, traits) {
        if (err) return callback(err);

        traits.forEach(function (trait) {
            payload[trait.property] = trait.value;
        });

        self
            .get(self.trackUrl + '/event')
            .query(payload)
            .set(headers())
            .end(self.handle(callback));
    });
};

