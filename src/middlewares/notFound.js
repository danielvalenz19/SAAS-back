// src/middlewares/notFound.js
function notFound(req, res, next) {
  res.status(404).json({
    ok: false,
    message: `Recurso no encontrado: ${req.method} ${req.originalUrl}`
  });
}

module.exports = notFound;
