// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Token no proporcionado' });
  }

  jwt.verify(token, env.jwt.secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ ok: false, message: 'Token inválido' });
    }

    req.user = decoded;
    next();
  });
}

module.exports = authMiddleware;
