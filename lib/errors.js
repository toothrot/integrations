
var util = require('util');


exports.Validation = IntegrationValidationError;
exports.BadRequest = BadRequestError;


function IntegrationValidationError (message) {
  Error.call(this);
  this.message = message;
}
util.inherits(IntegrationValidationError, Error);


function BadRequestError(message, status, body) {
  Error.call(this);
  this.message = message;
  this.status  = status;
  this.body    = body;
}
util.inherits(BadRequestError, Error);