// A typed error class so controllers can `throw new ApiError(404, 'Not found')`
// and have the central error handler respond with the right status code.
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
