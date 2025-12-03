// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const setupSwagger = require('./swagger/swagger');

const healthRoutes = require('./modules/health/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const rolesRoutes = require('./modules/roles/roles.routes');
const empresaRoutes = require('./modules/empresa/empresa.routes');
const sucursalesRoutes = require('./modules/sucursales/sucursales.routes');
const categoriasRoutes = require('./modules/categorias/categorias.routes');
const unidadesMedidaRoutes = require('./modules/unidadesMedida/unidadesMedida.routes');
const productosRoutes = require('./modules/productos/productos.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

setupSwagger(app);

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/usuarios', usersRoutes);
app.use('/roles', rolesRoutes);
app.use('/empresa', empresaRoutes);
app.use('/sucursales', sucursalesRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/unidades-medida', unidadesMedidaRoutes);
app.use('/productos', productosRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
