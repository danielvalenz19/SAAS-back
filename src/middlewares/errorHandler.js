// src/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);

  const status = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({
    ok: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;
