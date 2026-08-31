const ApiError = require('./ApiError')

class UnauthorizedError extends ApiError {
  constructor(message) {
    super(message , 401);
  }
}

module.exports = UnauthorizedError;
