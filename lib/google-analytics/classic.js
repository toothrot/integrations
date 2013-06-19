
var hash = require('string-hash')
  , is   = require('is')
  , url  = require('url')
  , util = require('util');


function GAClassic () {
  this.name    = 'Google Analytics';
  this.version = '5.2.5';
  this.url     = 'https://ssl.google-analytics.com/__utm.gif';
}


GAClassic.prototype.track = function (message, settings, callback) {

  var req = {
    url     : this.url,
    qs      : this._querystring(message, settings),
    headers : this._headers()
  };

  request.get(req, function (err, res, body) {
    if (err) return callback(err, body);
    if (res.statusCode === 200)  return callback(err, body);

    err = new errors.BadRequest('Failed Google Analytics request',
                                 res.statusCode,
                                 body);
    return callback(err, body);
  });
};


GAClassic.prototype.identify = function (message, settings, callback) {
  process.nextTick(callback);
};


GAClassic.prototype.alias = function (message, settings, callback) {
  process.nextTick(callback);
};

/**
 * Create the gif querystring:
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#gifParameters
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#pageNotAppearing
 * @return {Object}  querystring params
 */
GAClassic.prototype._querystring = function (message, settings) {

  var properties = message.properties
    , category   = properties.category || 'All'
    , label      = properties.label    || 'event'
    , action     = message.event;

  // Format the event querystring using the weird ga format
  var utme = util.format('5(%s*%s*%s)', category, event, label);

  if (is.number(properties.value)) {
    utme += '(' + Math.round(properties.value) + ')';
  }

  return {
    utmac : settings.serversideTrackingId,   // set our tracking id
    utmwv : this.version,                    // set the ga version
    utmcc : this._cookie(message, settings), // cookie request
    utmn  : Date.now(),                      // prevent caching
    utmcs : '-',                             // language
    utmt  : 'event',                         // type of request
    utme  : utme,                            // event tracking info
    utmni : 1                                // enable non-interaction
  };
};


GAClassic.prototype._cookie = function (message, settings) {

  // Check whether they explicitly passed in the cookie.
  if (data.context && data.context[this.name]) {
    var context = data.context[this.name]
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

    126210440.579990553.1301242771.1302852082.1302867721.40

    126210440 : Domain hash, unique for each domain
    579990553 : Unique Identifier (Unique ID)
    1301242771: Timestamp of time you first visited the site or '-'
    1302852082: Timestamp for the previous visit or '-'
    1302867721: Timestamp for the current visit or '-'
    40        : Number of sessions started
  */

  var domainHash = 1
    , userId     = hash(message.userId || message.sessionId)
    , visits     = 1
    , now        = Date.now() / 1000;

  var utma = [domainHash, userId, '-', '-', '-', visits].join('.');

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

  var utmz = [domainHash, now, 1, 1,
              'utmcsr=(none)|utmccn=(none)|utmcmd=(none)'].join('.');

  return {
    __utma : utma,
    __utmz : utmz
  };
}