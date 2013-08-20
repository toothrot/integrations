
var facade = require('segmentio-facade')
  , extend = require('extend')
  , uid    = require('uid');


var firstId  = uid()
  , secondId = uid()
  , email    = 'testing-' + firstId + '@segment.io';


exports.track = function (options) {
  options = extend({
    userId     : firstId,
    event      : 'Baked a cake',
    properties : {
      layers  : ['chocolate', 'strawberry', 'fudge'],
      revenue : 19.95,
      numLayers : 10
    },
    channel    : 'server',
    timestamp  : new Date(),
    options : {
      traits : {
        email   : email,
        age     : 23,
        created : new Date(),
        bad     : null,
        alsoBad : undefined
      }
    }
  }, options);
  return new facade.Track(options);
};


exports.track.bare = function () {
  return new facade.Track({
    userId  : 'aaa',
    event   : 'Bear tracks',
    channel : 'server'
  });
};



/**
 * Use a particular user id
 */

exports.identify = function (options) {
  options = extend({
    userId : firstId,
    traits : {
      firstName   : 'John',
      'Last Name' : 'Doe',
      email       : email,
      company     : 'Segment.io',
      city        : 'San Francisco',
      state       : 'CA',
      websites    : [
        'http://calv.info',
        'http://ianstormtaylor.com',
        'http://ivolo.me',
        'http://rein.pk'
      ],
      bad     : null,
      alsoBad : undefined
    },
    timestamp : new Date(),
    channel : 'server'
  }, options);
  return new facade.Identify(options);
};


exports.alias = function (options) {
  options = extend({
    from      : firstId,
    to        : secondId,
    channel   : 'server',
    timestamp : new Date()
  }, options);
  return new facade.Alias(options);
};