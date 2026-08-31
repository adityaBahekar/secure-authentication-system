function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  if (isOperational) {
    return res.status(statusCode).json({
      status: "error",
      message: err.message,
    });
  } else {
    console.error(err);
    return res.status(statusCode).json({
      status: "error",
      message: "Internal server error",
    });
  }
}

module.exports = errorMiddleware;
