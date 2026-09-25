const AppError = require('../utils/appError');
const handleCastErrorDB = err => { // cast error occurs when an invalid id is passed in the request
  const message = `Invalid ${err.path}: ${err.value}.`; // err.path is the field name and err.value is the invalid value
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0]; // regex to extract the duplicate value from the error message
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};          

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message); // extract all the error messages from the validation error object
  const message = `Invalid input data. ${errors.join('. ')}`;//evrey validation error has a message property that contains the error message
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => { // EDIT: added req because we need to know if request is API or website
  if (req.originalUrl.startsWith('/api')) { // NEW: if the request is for the API
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else { // NEW: if the request is for the website
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
};

const sendErrorProd = (err, req, res) => { // EDIT: added req because we need to know if request is API or website
  if (err.isOperational) {
    if (req.originalUrl.startsWith('/api')) { // NEW: API request → send JSON
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else { // NEW: website request → render error page
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
      });
    }
  } else {
    console.error('ERROR 💥', err);
    if (req.originalUrl.startsWith('/api')) { // NEW: API request → send JSON
      return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
      });
    } else { // NEW: website request → render error page
      return res.status(500).render('error', {
        title: 'Something went very wrong!',
        msg: 'Please try again later.'
      });
    }
  }
};

module.exports = (err, req, res, next) => { // global error handling middleware
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res); // EDIT: pass req

  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; // create a copy of the error object to avoid mutating the original error object
    error.message = err.message;
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    sendErrorProd(error, req, res); // EDIT: pass req
  }
};