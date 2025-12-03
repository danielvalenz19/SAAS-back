// src/modules/inventario/inventario.service.js
const repo = require('./inventario.repository');

function parseIntOrUndefined(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

async function getStock(empresaId, filtersRaw) {
  const filters = {
    sucursal_id: parseIntOrUndefined(filtersRaw.sucursal_id),
    producto_id: parseIntOrUndefined(filtersRaw.producto_id),
    categoria_id: parseIntOrUndefined(filtersRaw.categoria_id)
  };

  return repo.listStock(empresaId, filters);
}

async function getMovimientos(empresaId, filtersRaw) {
  const filters = {
    sucursal_id: parseIntOrUndefined(filtersRaw.sucursal_id),
    producto_id: parseIntOrUndefined(filtersRaw.producto_id),
    tipo: filtersRaw.tipo || undefined,
    motivo: filtersRaw.motivo || undefined,
    fecha_desde: filtersRaw.fecha_desde || undefined,
    fecha_hasta: filtersRaw.fecha_hasta || undefined
  };

  return repo.listMovimientos(empresaId, filters);
}

async function getMovimientoById(empresaId, movimientoId) {
  const mov = await repo.findMovimientoById(empresaId, movimientoId);
  if (!mov) {
    const err = new Error('Movimiento no encontrado');
    err.statusCode = 404;
    throw err;
  }
  return mov;
}

async function registrarAjuste(empresaId, usuarioId, data) {
  const sucursalId = data.sucursal_id;
  const productoId = data.producto_id;
  const cantidadRaw = data.cantidad;

  if (!sucursalId) {
    const err = new Error('sucursal_id es requerido');
    err.statusCode = 400;
    throw err;
  }
  if (!productoId) {
    const err = new Error('producto_id es requerido');
    err.statusCode = 400;
    throw err;
  }
  if (cantidadRaw === undefined || cantidadRaw === null) {
    const err = new Error('cantidad es requerida');
    err.statusCode = 400;
    throw err;
  }

  const cantidad = Number(cantidadRaw);
  if (Number.isNaN(cantidad) || cantidad === 0) {
    const err = new Error('cantidad debe ser un número distinto de 0');
    err.statusCode = 400;
    throw err;
  }

  const sucursal = await repo.findSucursalById(empresaId, sucursalId);
  if (!sucursal) {
    const err = new Error('La sucursal no existe en esta empresa');
    err.statusCode = 400;
    throw err;
  }

  const producto = await repo.findProductoById(empresaId, productoId);
  if (!producto) {
    const err = new Error('El producto no existe en esta empresa');
    err.statusCode = 400;
    throw err;
  }

  const absCantidad = Math.abs(cantidad);
  const tipo = cantidad > 0 ? 'ENTRADA' : 'SALIDA';

  let inv = await repo.findInventarioRow(empresaId, sucursalId, productoId);

  if (!inv) {
    const stockInicial = cantidad;
    const invId = await repo.insertInventarioRow(
      sucursalId,
      productoId,
      stockInicial,
      Number(producto.stock_minimo_general || 0)
    );
    inv = {
      id: invId,
      sucursal_id: sucursalId,
      producto_id: productoId,
      stock_actual: stockInicial
    };
  } else {
    const nuevoStock =
      tipo === 'ENTRADA'
        ? Number(inv.stock_actual) + absCantidad
        : Number(inv.stock_actual) - absCantidad;

    await repo.updateInventarioStock(sucursalId, productoId, nuevoStock);
    inv.stock_actual = nuevoStock;
  }

  await repo.insertMovimientoInventario({
    empresa_id: empresaId,
    sucursal_id: sucursalId,
    producto_id: productoId,
    tipo,
    motivo: data.motivo || 'AJUSTE',
    referencia_tipo: data.referencia_tipo || 'AJUSTE',
    referencia_id: null,
    cantidad: absCantidad,
    costo_unitario: null,
    precio_unitario: null,
    stock_despues: inv.stock_actual,
    fecha_movimiento: new Date(),
    usuario_id: usuarioId
  });

  return {
    sucursal_id: sucursalId,
    producto_id: productoId,
    stock_actual: inv.stock_actual
  };
}

async function registrarTraspaso(empresaId, usuarioId, data) {
  const sucursalOrigenId = data.sucursal_origen_id;
  const sucursalDestinoId = data.sucursal_destino_id;
  const productoId = data.producto_id;
  const cantidadRaw = data.cantidad;

  if (!sucursalOrigenId || !sucursalDestinoId) {
    const err = new Error('sucursal_origen_id y sucursal_destino_id son requeridos');
    err.statusCode = 400;
    throw err;
  }

  if (sucursalOrigenId === sucursalDestinoId) {
    const err = new Error('La sucursal origen y destino deben ser distintas');
    err.statusCode = 400;
    throw err;
  }

  if (!productoId) {
    const err = new Error('producto_id es requerido');
    err.statusCode = 400;
    throw err;
  }

  if (cantidadRaw === undefined || cantidadRaw === null) {
    const err = new Error('cantidad es requerida');
    err.statusCode = 400;
    throw err;
  }

  const cantidad = Number(cantidadRaw);
  if (Number.isNaN(cantidad) || cantidad <= 0) {
    const err = new Error('cantidad debe ser un número mayor a 0');
    err.statusCode = 400;
    throw err;
  }

  const sucursalOrigen = await repo.findSucursalById(empresaId, sucursalOrigenId);
  if (!sucursalOrigen) {
    const err = new Error('La sucursal de origen no existe en esta empresa');
    err.statusCode = 400;
    throw err;
  }

  const sucursalDestino = await repo.findSucursalById(empresaId, sucursalDestinoId);
  if (!sucursalDestino) {
    const err = new Error('La sucursal de destino no existe en esta empresa');
    err.statusCode = 400;
    throw err;
  }

  const producto = await repo.findProductoById(empresaId, productoId);
  if (!producto) {
    const err = new Error('El producto no existe en esta empresa');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();

  let invOrigen = await repo.findInventarioRow(empresaId, sucursalOrigenId, productoId);

  if (!invOrigen) {
    const stockInicial = 0 - cantidad;
    const invId = await repo.insertInventarioRow(
      sucursalOrigenId,
      productoId,
      stockInicial,
      Number(producto.stock_minimo_general || 0)
    );
    invOrigen = {
      id: invId,
      sucursal_id: sucursalOrigenId,
      producto_id: productoId,
      stock_actual: stockInicial
    };
  } else {
    const nuevoStock = Number(invOrigen.stock_actual) - cantidad;
    await repo.updateInventarioStock(sucursalOrigenId, productoId, nuevoStock);
    invOrigen.stock_actual = nuevoStock;
  }

  await repo.insertMovimientoInventario({
    empresa_id: empresaId,
    sucursal_id: sucursalOrigenId,
    producto_id: productoId,
    tipo: 'SALIDA',
    motivo: 'TRASPASO_SALIDA',
    referencia_tipo: 'TRASPASO',
    referencia_id: null,
    cantidad,
    costo_unitario: null,
    precio_unitario: null,
    stock_despues: invOrigen.stock_actual,
    fecha_movimiento: now,
    usuario_id: usuarioId
  });

  let invDestino = await repo.findInventarioRow(empresaId, sucursalDestinoId, productoId);

  if (!invDestino) {
    const stockInicial = cantidad;
    const invId = await repo.insertInventarioRow(
      sucursalDestinoId,
      productoId,
      stockInicial,
      Number(producto.stock_minimo_general || 0)
    );
    invDestino = {
      id: invId,
      sucursal_id: sucursalDestinoId,
      producto_id: productoId,
      stock_actual: stockInicial
    };
  } else {
    const nuevoStock = Number(invDestino.stock_actual) + cantidad;
    await repo.updateInventarioStock(sucursalDestinoId, productoId, nuevoStock);
    invDestino.stock_actual = nuevoStock;
  }

  await repo.insertMovimientoInventario({
    empresa_id: empresaId,
    sucursal_id: sucursalDestinoId,
    producto_id: productoId,
    tipo: 'ENTRADA',
    motivo: 'TRASPASO_ENTRADA',
    referencia_tipo: 'TRASPASO',
    referencia_id: null,
    cantidad,
    costo_unitario: null,
    precio_unitario: null,
    stock_despues: invDestino.stock_actual,
    fecha_movimiento: now,
    usuario_id: usuarioId
  });

  return {
    sucursal_origen_id: sucursalOrigenId,
    sucursal_destino_id: sucursalDestinoId,
    producto_id: productoId,
    stock_origen: invOrigen.stock_actual,
    stock_destino: invDestino.stock_actual
  };
}

module.exports = {
  getStock,
  getMovimientos,
  getMovimientoById,
  registrarAjuste,
  registrarTraspaso
};
