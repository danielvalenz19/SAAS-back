// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const setupSwagger = require('./swagger/swagger');

const healthRoutes = require('./modules/health/health.routes');
const authRoutes = require('./modules/auth/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

setupSwagger(app);

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
