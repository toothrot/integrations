
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var extend = require('extend');
var object = require('obj-case');

/**
 * Expose `Calq`
 */

var Calq = module.exports = integration('Calq')
  .endpoint('https://api.calq.io')
  .retries(3);

/**
 * Validate.
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

Calq.prototype.validate = function (message, settings) {
    return this.ensure(settings.writeKey, 'writeKey');
};

/**
 * Track a new action/event within Calq.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Calq.prototype.track = function (track, settings, callback) {
    var payload = {
        actor           : track.userId() || identify.sessionId(),
        action_name     : track.event(),
        properties      : _getTrackProperties(track),
        ip_address      : track.ip(),
        write_key       : settings.writeKey
    };

    return this
        .post('/track')
        .type('json')
        .send(payload)
        .end(this.handle(callback));
};

/**
 * Alias a user from one id to the other. In Calq this is called Transfer.
 *
 * @param {Alias} alias
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Calq.prototype.alias = function (alias, settings, callback) {
    var payload = {
        old_actor : alias.from(),
        new_actor : alias.to(),
        write_key : settings.writeKey
    };

    return this
        .post('/transfer')
        .type('json')
        .send(payload)
        .end(this.handle(callback));
};


/**
 * Identify the user. In Calq this is called Profile.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Calq.prototype.identify = function (identify, settings, callback) {
    var properties = _getProfileProperties(identify);

    // Skip if there is no data - Calq requires data
    var size = 0, hasValues = false;
    for (var key in properties) {
        if (properties.hasOwnProperty(key) && properties[key] != null) {
            hasValues = true;
            break;
        }
    }
    if (!hasValues) {
        return process.nextTick(callback);
    }

    var payload = {
        actor           : identify.userId() || identify.sessionId(),
        properties      : properties,
        write_key       : settings.writeKey
    };

    return this
        .post('/profile')
        .type('json')
        .send(payload)
        .end(this.handle(callback));
};


/**
 * Gets the track properties to be sent with a track call.
 *
 * @param {Track} track
 */

function _getTrackProperties(track) {
    var properties = {
        $device_agent : track.userAgent(),
    };

    properties = extend(true, properties, track.traits() || {});

    // Might not be present?
    var width = track.proxy('context.screen.width');
    var height = track.proxy('context.screen.height');
    if (!isNaN(width) && width > 0 && !isNaN(height) && height > 0) {
        properties.$device_resolution =
            track.proxy('context.screen.width') + "x" + track.proxy('context.screen.height');
    }

    // Campaign is mapped to special properties in Calq
    var campaign = track.proxy('context.campaign');
    if (campaign) {
        properties.$utm_campaign  = campaign.name;
        properties.$utm_source    = campaign.source;
        properties.$utm_medium    = campaign.medium;
        properties.$utm_content   = campaign.content;
        properties.$utm_term      = campaign.term;
    }

    properties = extend(true, properties, track.properties() || {});

    // Calq needs both currency and value together or neither
    var saleCurrency = track.currency();
    var saleValue = track.revenue();
    if (saleCurrency != null && saleCurrency.length == 3 && !isNaN(saleValue)) {
        properties.$sale_currency = saleCurrency;
        properties.$sale_value    = saleValue;
        object.del(properties, 'currency'); // Don't send twice
        object.del(properties, 'revenue');  // Don't send twice
    }

    return properties;
}


function _getProfileProperties (identify) {
    var traits = identify.traits() || {};

    extend(traits, {
        $full_name  : identify.name(),
        $image_url  : identify.avatar(),
        $gender     : identify.proxy('traits.gender'),
        $age        : identify.proxy('traits.age'),
        $email      : identify.email(),
        $phone      : identify.phone(),
        
    });

    // Remove dupes now we have mapped them
    object.del(traits, 'name');
    object.del(traits, 'avatar');
    object.del(traits, 'gender');
    object.del(traits, 'age');
    object.del(traits, 'email');
    object.del(traits, 'phone');

    return traits;
}