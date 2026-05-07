const errorHandler = (err, req, res, next) => {
  console.error("💥 Error:", err.stack);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(", ") });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ error: `${field} already exists` });
  }

  // OpenAI API errors
  if (err.status && err.error) {
    return res.status(err.status).json({ error: err.error.message });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
  });
};

module.exports = errorHandler;