
var facade = require('segmentio-facade')
  , random = Math.floor(Math.random() * 10000)
  , email  = 'mordac' + random + '@segment.io';


exports.track = function () {
  return new facade.Track({
    userId     : 'aaa',
    event      : 'Baked a cake',
    properties : {
      layers  : ['chocolate', 'strawberry', 'fudge'],
      revenue : 19.95
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
  });
};


exports.track.bare = function () {
  return new facade.Track({
    userId  : 'aaa',
    event   : 'Bear tracks',
    channel : 'server'
  });
};


exports.identify = function () {
  return new facade.Identify({
    userId : 'aaa',
    traits : {
      firstName   : 'John',
      'Last Name' : 'Doe',
      email       : email,
      company     : 'Segment.io',
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
  });
};


exports.alias = function () {
  return new facade.Alias({
    from      : 'aaa',
    to        : 'bbb',
    channel   : 'server',
    timestamp : new Date()
  });
};