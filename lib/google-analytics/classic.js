var debug       = require('debug')('segmentio:integrations:google-analytics-classic')
  , extend      = require('extend')
  , hash        = require('string-hash')
  , Integration = require('segmentio-integration')
  , is          = require('is')
  , request     = require('request-retry')({ retries : 2 })
  , util        = require('util')
  , unixTime    = require('unix-time')
  , validQs     = require('valid-querystring');


module.exports = GAClassic;


function GAClassic () {
  this.name    = 'Google Analytics';
  this.version = '5.4.3';
  this.url     = 'https://ssl.google-analytics.com/__utm.gif';
}


util.inherits(GAClassic, Integration);


/**
 * Tracks an event in google analytics
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#gifParameters
 */

GAClassic.prototype.track = function (track, settings, callback) {
  var qs = this._querystring(track, settings);

  extend(qs, {
    utmt  : 'event',            // type of request
    utme  : formatEvent(track), // event tracking info
    utmni : 1                   // enable non-interaction to not count pageviews
  });

  if (!validQs(qs)) return callback(new Error('Invalid querystring'));

  var req = {
    url     : this.url,
    qs      : qs,
    headers : this._headers(track, settings)
  };

  debug('making track request');
  request.get(req, this._handleResponse(callback));
};



/**
 * Record a pageview, used for initializing an empty project and getting
 * it to start recording GA data
 */

GAClassic.prototype._pageview = function (track, settings, callback) {

  var qs = this._querystring(track, settings);

  extend(qs, {
    utmdt : track.proxy('properties.title') || '',  // title
    utmp  : track.proxy('properties.path') || '/',  // path
  });

  var req = {
    url     : this.url,
    qs      : qs,
    headers : this._headers(track, settings)
  };
  if (!validQs(req.qs)) return callback(new Error('Invalid querystring'));
  debug('making pageview request');
  request.get(req, this._handleResponse(callback));
};

/**
 * Create the gif querystring:
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#gifParameters
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#pageNotAppearing
 * @return {Object}  querystring params
 */
GAClassic.prototype._querystring = function (message, settings) {

  return {
    utmhn : settings.domain,                 // site domain (optional)
    utmac : settings.serversideTrackingId,   // set our tracking id
    utmwv : this.version,                    // set the ga version
    utmcc : this._cookie(message, settings), // cookie request
    utmn  : unixTime(new Date()),            // prevent caching
    utmcs : '-',                             // language
    utmr  : '-'                              // referrer url
  };
};



/**
 * Set the proper headers for the cookie request
 * @param  {Facade} message
 * @param  {Object} settings
 */

GAClassic.prototype._headers = function (message, settings) {
  var userAgent = message.userAgent();

  if (userAgent) userAgent = userAgent.full;
  else userAgent = 'not set';

  return {
    'User-Agent' : userAgent
  };
};


/**
 * Generate a cookie for the request
 */

GAClassic.prototype._cookie = function (message, settings) {
  var options = message.options(this.name);

  // Check whether they explicitly passed in the cookie.
  if (options) {
    var cookie = options.cookie || options.utmcc; // backwards compat for utmcc
    if (is.string(cookie)) return cookie;
  }

  return buildCookie(message, settings);
};




/**
 * Builds a cookie for segment.io using a combination of:
 *
 * http://www.tutkiun.com/2011/04/a-google-analytics-cookie-explained.html
 * http://www.vdgraaf.info/wp-content/uploads/image-url-explained.txt
 * https://github.com/jgallen23/node-ga
 */
function buildCookie (message, settings) {

  /**
   * UTMA: Cookie indicating visitor information
   *
   * ex. 1.579990553.1301242771.1302852082.1302867721.40
   *
   * 1         : Domain hash, unique for each domain, can be set to '1'
   * 579990553 : Unique identifier for the user
   * 1301242771: Timestamp of time you first visited the site
   * 1302852082: Timestamp for the previous visit
   * 1302867721: Timestamp for the current visit
   * 40        : Number of sessions started
   */

  var domainHash = 1
    , userId     = hash(message.userId() || message.sessionId())
    , visits     = 1
    , now        = unixTime(new Date());

  var utma = [domainHash, userId, now, now, now, visits].join('.');

  /*
   * UTMZ: Traffic Sources cookie
   *
   * ex. 126210440.1302625640.30.3.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=page%20load%20javascript
   *
   * 126210440 :  Domain Hash
   * 1302625640 :   Timestamp when cookie was set
   * 30 : Session number
   * 3 : Campaign number
   * utmcsr=google : Campaign source
   * utmccn=(organic):  Campaign name
   * utmcmd=organic :  Campaign medium [Organic, referral, cpc and email]
   * utmctr=page%20load%20javascript : last keyword used to enter in site.
   */

  var utmz = [
    domainHash,
    now,
    1,
    1,
    'utmcsr=(none)|utmccn=(none)|utmcmd=(none)|utmcr=(none)'
  ].join('.');

  return util.format('__utma=%s; __utmz=%s;', utma, utmz);
}


/**
 * Format the event querystring using the weird ga format
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#gifParameters
 */

function formatEvent (track) {

  var value      = track.proxy('properties.value') || track.revenue()
    , category   = track.proxy('properties.category') || 'All'
    , label      = track.proxy('properties.label')    || 'event'
    , event      = track.event();

  var formatted = util.format('5(%s*%s*%s)', category, event, label);

  if (is.number(value)) formatted += '(' + Math.round(value) + ')';

  return formatted;
}
