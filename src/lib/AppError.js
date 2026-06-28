// Custom error class — supaya kita bisa lempar error
// dengan statusCode dan code yang spesifik dari mana saja
class AppError extends Error {
    constructor(code, message, statusCode = 400) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = AppError;