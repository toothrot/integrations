
var dot = require('obj-case').find;
var hash = require('string-hash');
var parse = require('url').parse;

/**
 * Map page msg.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#page
 *
 * @param {Page} page
 * @param {Object} settings
 * @return {Object}
 */

exports.page = function(page, settings){
  var ret = common(page, settings);
  ret.dt = page.fullName();
  ret.t = 'pageview';

  if (!page.url()) return ret;

  var parsed = parse(url);
  ret.dh = parsed.hostname;
  ret.dp = parsed.path;
  return ret;
};

/**
 * Track.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#event
 *
 * @param {Page} track
 * @param {Object} settings
 */

exports.track = function(track, settings){
  var ret = common(track, settings);
  ret.ev = Math.round(track.value() || track.revenue() || 0);
  ret.el = track.proxy('properties.label') || 'event';
  ret.ec = track.category() || 'All';
  ret.ea = track.event();
  ret.t = 'event';
  return ret;
};

/**
 * Map Completed Order.
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
 * @return {Array[Object]} rets
 */

exports.completedOrder = function(track, settings){
  var currency = track.currency();
  var orderId = track.orderId();
  var items = track.products();

  var transaction = common(track, settings);
  transaction.ta = track.proxy('properties.affiliation');
  transaction.ts = track.shipping();
  transaction.tr = track.revenue();
  transaction.t = 'transaction';
  transaction.tt = track.tax();
  transaction.cu = currency;
  transaction.ti = orderId;

  items = items.map(function(item){
    item = new Track({ properties: item });
    var ret = common(track, settings);
    ret.iq = item.quantity();
    ret.iv = item.category();
    ret.ip = item.price();
    ret.in = item.name();
    ret.ic = item.sku();
    ret.cu = currency;
    ret.ti = orderId;
    ret.t = 'item';
    return ret;
  });

  return [transaction].concat(items);
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

function common(facade, settings){
  var cid = hash(track.userId() || track.anonymousId());
  var options = track.options('Google Analytics');
  var tid = settings.serversideTrackingId;
  if (options && is.string(options.clientId)) cid = options.clientId;

  var form = {};
  form.cid = cid;
  form.tid = tid;
  form.v = 1;

  if (settings.sendUserId && track.userId()) form.uid = track.userId();
  if (track.userAgent()) form.ua = track.userAgent();
  if (track.ip()) form.uip = track.ip();

  return form;
}

/**
 * Map google's custom dimensions & metrics with `obj`.
 *
 * Example:
 *
 *      metrics({ revenue: 1.9 }, { { metrics : { revenue: 'metric8' } });
 *      // => { metric8: 1.9 }
 *
 *      metrics({ revenue: 1.9 }, {});
 *      // => {}
 *
 * @param {Object} obj
 * @param {Object} data
 * @return {Object|null}
 * @api private
 */

function metrics(obj, data){
  var dimensions = data.dimensions;
  var metrics = data.metrics;
  var names = keys(metrics).concat(keys(dimensions));
  var ret = {};

  for (var i = 0; i < names.length; ++i) {
    var name = names[i];
    var key = metrics[name] || dimensions[name];
    var value = dot(obj, name) || obj[name];
    if (null == value) continue;
    ret[key] = value;
  }

  return ret;
}

/**
 *
 */

function parameter(name){
  var metric = /metric(\d+)/;
  var dimension = /dimension(\d+)/;
  if (metric.test(name)) return metric.match(name)[1];
  if (dimension.test(name)) return dimension.match(name)[1];
  return '';
}