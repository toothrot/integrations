
var errors   = require('../errors')
  , hash     = require('string-hash')
  , is       = require('is')
  , Provider = require('../provider')
  , request  = require('request-retry')({ retries : 2 })
  , url      = require('url')
  , util     = require('util');


module.exports = GAClassic;


function GAClassic () {
  this.name    = 'Google Analytics';
  this.version = '5.4.3';
  this.url     = 'https://ssl.google-analytics.com/__utm.gif';
}


util.inherits(GAClassic, Provider);


GAClassic.prototype.track = function (message, settings, callback) {

  var req = {
    url     : this.url,
    qs      : this._querystring(message, settings),
    headers : this._headers(message, settings)
  };

  request.get(req, this._handleResponse(callback));
};


/**
 * Create the gif querystring:
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#gifParameters
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#pageNotAppearing
 * @return {Object}  querystring params
 */
GAClassic.prototype._querystring = function (message, settings) {

  var properties = message.properties()
    , category   = properties.category || 'All'
    , label      = properties.label    || 'event'
    , event      = message.event;

  // Format the event querystring using the weird ga format
  var utme = util.format('5(%s*%s*%s)', category, event, label);

  if (is.number(properties.value)) {
    utme += '(' + Math.round(properties.value) + ')';
  }

  return {
    utmac : settings.serversideTrackingId,   // set our tracking id
    utmwv : this.version,                    // set the ga version
    utmcc : this._cookie(message, settings), // cookie request
    utmn  : Math.floor(Date.now() / 1000),   // prevent caching
    utmcs : '-',                             // language
    utmt  : 'event',                         // type of request
    utme  : utme,                            // event tracking info
    utmni : 1,                               // enable non-interaction
    utmhn : 'segment.io'
  };
};


GAClassic.prototype._headers = function (message, settings) {
  var userAgent = 'not set'
    , options   = message.options();

  if (options && options.userAgent) {
    userAgent = options.userAgent.userAgent;
  }

  return {
    'User-Agent' : userAgent
  };
};


GAClassic.prototype._cookie = function (message, settings) {
  var options = message.options();

  // Check whether they explicitly passed in the cookie.
  if (options && options[this.name]) {
    var context = options[this.name]
      , cookie  = context.cookie || context.utmcc; // backwards compat for utmcc

    if (is.string(cookie)) return cookie;
  }

  return buildCookie(message, settings);
};


/**
 * Using a combination of:
 *
 * http://www.tutkiun.com/2011/04/a-google-analytics-cookie-explained.html
 * http://www.vdgraaf.info/wp-content/uploads/image-url-explained.txt
 * https://github.com/jgallen23/node-ga
 */
function buildCookie (message, settings) {

  /*
    UTMA: Visitors
    A cookie set for 2 years

    1.579990553.1301242771.1302852082.1302867721.40

    1         : Domain hash, unique for each domain, can be set to '1'
    579990553 : Unique identifier for the user
    1301242771: Timestamp of time you first visited the site
    1302852082: Timestamp for the previous visit
    1302867721: Timestamp for the current visit
    40        : Number of sessions started
  */

  var domainHash = 1
    , userId     = hash(message.userId() || message.sessionId())
    , visits     = 1
    , now        = Math.floor(Date.now() / 1000);

  var utma = [domainHash, userId, now, now, now, visits].join('.');

  /*
    UTMZ: Traffic Sources

    126210440.1302625640.30.3.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=page%20load%20javascript

    126210440 :  Domain Hash
    1302625640 :   Timestamp when cookie was set
    30 : Session number
    3 : Campaign number
    utmcsr=google : Campaign source
    utmccn=(organic):  Campaign name
    utmcmd=organic :  Campaign medium [Organic, referral, cpc and email]
    utmctr=page%20load%20javascript : last keyword used to enter in site.
  */

  var utmz = [ domainHash, now, 1, 1,
               'utmcsr=(none)|utmccn=(none)|utmcmd=(none)|utmcr=(none)'
              ].join('.');

  return util.format('__utma=%s; __utmz=%s;', utma, utmz);
}