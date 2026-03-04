const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        error.message = 'Duplicate entry found';
        error.status = 409;
        break;
      case '23503': // Foreign key violation
        error.message = 'Referenced record not found';
        error.status = 400;
        break;
      case '23502': // Not null violation
        error.message = 'Required field is missing';
        error.status = 400;
        break;
      case '42P01': // Undefined table
        error.message = 'Database table not found';
        error.status = 500;
        break;
      case '42703': // Undefined column
        error.message = 'Database column not found';
        error.status = 500;
        break;
      default:
        error.message = 'Database error';
        error.status = 500;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid authentication token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Authentication token expired';
    error.status = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.status = 400;
    error.details = err.details;
  }

  // Rate limiting errors
  if (err.status === 429) {
    error.message = 'Too many requests. Please try again later.';
    error.status = 429;
  }

  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Stack:', err.stack);
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: error.details 
    })
  });
};

module.exports = { errorHandler };
