
var facade = require('segmentio-facade');


exports.track = function () {
  return new facade.Track({
    userId     : 'aaa',
    event      : 'Baked a cake',
    properties : {
      layers  : ['chocolate', 'strawberry', 'fudge'],
      revenue : 19.95
    },
    channel    : 'server',
    timestamp  : new Date()
  });
};


exports.identify = function () {
  return new facade.Identify({
    userId : 'aaa',
    traits : {
      //created : new Date(),
      name    : 'John Doe'
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