const ApiError = require("../utils/ApiError");

/**
 * @desc Global Express error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error in development environment
  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  // Handle MongoDB Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists and must be unique.`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((el) => el.message);
    error = new ApiError(400, "Database validation failed", errors);
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === "CastError") {
    error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
  }

  // Ensure it's an instance of ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    data: null,
  };

  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
