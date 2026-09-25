class AppError extends Error {
  constructor(message, statusCode) { // executed when we create new appError object
    super(message); // calling the parent class constructor (Error) with the message parameter

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; 

    Error.captureStackTrace(this, this.constructor); // function to find place of the error in the stack trace
  } // this.constructor = Apperror 
}
module.exports = AppError;