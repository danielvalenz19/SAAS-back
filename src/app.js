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
const clientesRoutes = require('./modules/clientes/clientes.routes');
const creditosClientesRoutes = require('./modules/creditos_clientes/creditos_clientes.routes');
const ventasRoutes = require('./modules/ventas/ventas.routes');
const proveedoresRoutes = require('./modules/proveedores/proveedores.routes');
const creditosProveedoresRoutes = require('./modules/creditos_proveedores/creditos_proveedores.routes');
const comprasRoutes = require('./modules/compras/compras.routes');
const inventarioRoutes = require('./modules/inventario/inventario.routes');

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
app.use('/clientes', clientesRoutes);
app.use('/creditos/clientes', creditosClientesRoutes);
app.use('/ventas', ventasRoutes);
app.use('/proveedores', proveedoresRoutes);
app.use('/creditos/proveedores', creditosProveedoresRoutes);
app.use('/compras', comprasRoutes);
app.use('/inventario', inventarioRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
