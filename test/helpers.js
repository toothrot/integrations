


exports.track = function () {
  return {
    userId     : 'aaa',
    event      : 'Baked a cake',
    properties : {
      revenue : 19.95
    },
    channel    : 'server',
    timestamp  : new Date()
  };
};


exports.identify = function () {
  return {
    userId : 'aaa',
    traits : {
      created : new Date(),
      name    : 'John Doe'
    },
    timstamp : new Date()
  };
};