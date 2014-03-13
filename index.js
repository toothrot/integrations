
module.exports = process.env.INTEGRATIONS_COV
  ? require('./lib-cov')
  : require('./lib');
