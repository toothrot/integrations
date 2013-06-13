
var util = require('util');


exports.Validation = IntegrationValidationError;


function IntegrationValidationError (message) {
  Error.call(this);
  this.message = message;
}
util.inherits(IntegrationValidationError, Error);