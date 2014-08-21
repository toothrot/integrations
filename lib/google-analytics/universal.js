
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var Track = require('segmentio-facade').Track;
var hash = require('string-hash');
var parse = require('url').parse;
var Batch = require('batch');
var is = require('is');

/**
 * Expose `GA`
 */

var GA = module.exports = integration('Google Analytics')
  .endpoint('https://ssl.google-analytics.com/collect')
  .retries(2);

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} callback
 */

GA.prototype.track = function (track, settings, callback) {
  return this
    .post()
    .type('form')
    .send(this._common(track, settings))
    .send({ ec: track.proxy('properties.category') || 'All' })
    .send({ el: track.proxy('properties.label') || 'event' })
    .send({ ev: Math.round(track.value() || track.revenue() || 0) })
    .send({ ea: track.event() })
    .send({ t: 'event' })
    .end(this.handle(callback));
};

/**
 * Completed Order.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#ecom
 *
 *    - `t` - type
 *    - `ti` - transaction id (.orderId())
 *    - `ta` - transaction affiliation
 *    - `tr` - transaction revenue (.revenue())
 *    - `ts` - transaction shipping (.shipping())
 *    - `tt` - transaction tax (.tax())
 *    - `cu` - currency code (.currency())
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} callback
 */

GA.prototype.completedOrder = function(track, settings, callback){
  var currency = track.currency();
  var orderId = track.orderId();
  var items = track.products();
  var batch = new Batch;
  var self = this;

  // make sure batch throws.
  batch.throws(true);

  // transaction hit.
  batch.push(function(done){
    self
      .post()
      .type('form')
      .send(self._common(track, settings))
      .send({ t: 'transaction' })
      .send({ ti: orderId })
      .send({ ta: track.proxy('properties.affiliation') })
      .send({ tr: track.revenue() })
      .send({ ts: track.shipping() })
      .send({ tt: track.tax() })
      .send({ cu: currency })
      .end(self.handle(done));
  });

  // item hit.
  items.forEach(function(item){
    item = new Track({ properties: item });
    batch.push(function(done){
      self
      .post()
      .type('form')
      .send(self._common(track, settings))
      .send({ t: 'item' })
      .send({ ti: orderId })
      .send({ in: item.name() })
      .send({ ip: item.price() })
      .send({ iq: item.quantity() })
      .send({ ic: item.sku() })
      .send({ iv: item.category() })
      .send({ cu: currency })
      .end(self.handle(done));
    });
  });

  // end
  batch.end(callback);
};

/**
 * Page.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#page
 *
 * @param {Page} page
 * @param {Object} settings
 * @param {Function} fn
 */

GA.prototype.page = function(page, settings, fn){
  var parsed = parse(page.proxy('properties.url') || '');
  return this
    .post()
    .type('form')
    .send(this._common(page, settings))
    .send({ dt: page.fullName() })
    .send({ dh: parsed.hostname })
    .send({ dp: parsed.path })
    .send({ t: 'pageview' })
    .end(this.handle(fn));
};

/**
 * Get headers.
 *
 * @return {Object}
 */

GA.prototype._headers = function (message) {
  var userAgent = message.userAgent();
  return {
    'User-Agent' : userAgent || 'not set'
  };
};

/**
 * Create common ga form.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#using-a-proxy-server
 *
 * @param {Object} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

GA.prototype._common = function(track, settings){
  var cid = hash(track.userId() || track.sessionId());
  var options = track.options(this.name);
  var tid = settings.serversideTrackingId;

  if (options && is.string(options.clientId)) {
    cid = options.clientId;
  }

  var form = {
    v: 1,
    cid: cid,
    tid: tid
  };

  if (track.ip()) form.uip = track.ip();
  if (track.userAgent()) form.ua = track.userAgent();
  if (settings.sendUserId && track.userId()) form.uid = track.userId();

  return form;
}
