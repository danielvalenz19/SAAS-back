// src/modules/ventas/ventas.service.js
const repo = require('./ventas.repository');

function parseIntOrUndefined(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

async function listVentas(empresaId, filtersRaw) {
  const filters = {
    cliente_id: parseIntOrUndefined(filtersRaw.cliente_id),
    sucursal_id: parseIntOrUndefined(filtersRaw.sucursal_id),
    tipo_venta: filtersRaw.tipo_venta || undefined,
    estado: filtersRaw.estado || undefined,
    fecha_desde: filtersRaw.fecha_desde || undefined,
    fecha_hasta: filtersRaw.fecha_hasta || undefined
  };

  return repo.listVentas(empresaId, filters);
}

async function detailVenta(empresaId, ventaId) {
  const venta = await repo.findVentaById(empresaId, ventaId);
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const detalle = await repo.getVentaDetalle(empresaId, ventaId);

  return { venta, detalle };
}

function validarTipoVenta(tipo_venta) {
  const allowed = ['CONTADO', 'CREDITO'];
  if (!tipo_venta) return 'CONTADO';
  const up = tipo_venta.toUpperCase();
  if (!allowed.includes(up)) {
    const err = new Error('tipo_venta inválido (CONTADO | CREDITO)');
    err.statusCode = 400;
    throw err;
  }
  return up;
}

function calcularTotales(items, tipo_venta) {
  let total_bruto = 0;
  let descuento_total = 0;

  for (const it of items) {
    const cantidad = Number(it.cantidad);
    const precio = Number(it.precio_unitario);
    const desc = Number(it.descuento || 0);

    if (Number.isNaN(cantidad) || cantidad <= 0) {
      const err = new Error('Cantidad inválida en un item');
      err.statusCode = 400;
      throw err;
    }
    if (Number.isNaN(precio) || precio < 0) {
      const err = new Error('precio_unitario inválido en un item');
      err.statusCode = 400;
      throw err;
    }
    if (Number.isNaN(desc) || desc < 0) {
      const err = new Error('descuento inválido en un item');
      err.statusCode = 400;
      throw err;
    }

    total_bruto += cantidad * precio;
    descuento_total += desc;
  }

  const total_neto = Number((total_bruto - descuento_total).toFixed(2));
  let saldo_pendiente = 0;
  let estado = 'PAGADA';

  if (tipo_venta === 'CREDITO') {
    saldo_pendiente = total_neto;
    estado = 'PENDIENTE';
  }

  return {
    total_bruto: Number(total_bruto.toFixed(2)),
    descuento_total: Number(descuento_total.toFixed(2)),
    total_neto,
    saldo_pendiente,
    estado
  };
}

async function createVenta(empresaId, usuarioId, data) {
  if (!data.sucursal_id) {
    const err = new Error('sucursal_id es requerido');
    err.statusCode = 400;
    throw err;
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    const err = new Error('Se requiere al menos un item en la venta');
    err.statusCode = 400;
    throw err;
  }

  const sucursal = await repo.findSucursalById(empresaId, data.sucursal_id);
  if (!sucursal) {
    const err = new Error('La sucursal no existe en esta empresa');
    err.statusCode = 400;
    throw err;
  }

  const tipo_venta = validarTipoVenta(data.tipo_venta);

  if (!data.fecha_venta) {
    const err = new Error('fecha_venta es requerida');
    err.statusCode = 400;
    throw err;
  }

  if (tipo_venta === 'CREDITO' && !data.fecha_vencimiento) {
    const err = new Error('fecha_vencimiento es requerida para ventas a crédito');
    err.statusCode = 400;
    throw err;
  }

  const productosCache = new Map();

  for (const item of data.items) {
    if (!item.producto_id) {
      const err = new Error('producto_id es requerido en cada item');
      err.statusCode = 400;
      throw err;
    }
    if (!item.unidad_medida_id) {
      const err = new Error('unidad_medida_id es requerido en cada item');
      err.statusCode = 400;
      throw err;
    }

    const prodId = item.producto_id;
    if (!productosCache.has(prodId)) {
      const prod = await repo.findProductoForVenta(empresaId, prodId);
      if (!prod) {
        const err = new Error(`Producto ${prodId} no pertenece a esta empresa`);
        err.statusCode = 400;
        throw err;
      }
      if (!prod.es_activo) {
        const err = new Error(`Producto ${prodId} está inactivo`);
        err.statusCode = 400;
        throw err;
      }
      productosCache.set(prodId, prod);
    }
  }

  const totales = calcularTotales(data.items, tipo_venta);

  const ventaId = await repo.createVenta(
    empresaId,
    usuarioId,
    {
      sucursal_id: data.sucursal_id,
      cliente_id: data.cliente_id,
      tipo_venta,
      fecha_venta: data.fecha_venta,
      fecha_vencimiento: data.fecha_vencimiento,
      observaciones: data.observaciones
    },
    totales
  );

  for (const item of data.items) {
    const prod = productosCache.get(item.producto_id);
    const costo_unitario = Number(prod.precio_compra_referencia || 0);

    await repo.createVentaDetalle(ventaId, item, costo_unitario);

    const cantidad = Number(item.cantidad);
    const precio_unitario = Number(item.precio_unitario);

    let inv = await repo.findInventarioRow(empresaId, data.sucursal_id, item.producto_id);

    if (!inv) {
      const stockInicial = 0 - cantidad;
      const invId = await repo.insertInventarioRow(data.sucursal_id, item.producto_id, stockInicial, 0);
      inv = {
        id: invId,
        sucursal_id: data.sucursal_id,
        producto_id: item.producto_id,
        stock_actual: stockInicial
      };
    } else {
      const nuevoStock = Number(inv.stock_actual) - cantidad;
      await repo.updateInventarioStock(data.sucursal_id, item.producto_id, nuevoStock);
      inv.stock_actual = nuevoStock;
    }

    await repo.insertMovimientoInventario({
      empresa_id: empresaId,
      sucursal_id: data.sucursal_id,
      producto_id: item.producto_id,
      tipo: 'SALIDA',
      motivo: 'VENTA',
      referencia_tipo: 'VENTA',
      referencia_id: ventaId,
      cantidad,
      costo_unitario,
      precio_unitario,
      stock_despues: inv.stock_actual,
      fecha_movimiento: data.fecha_venta,
      usuario_id: usuarioId
    });
  }

  return ventaId;
}

async function anularVenta(empresaId, usuarioId, ventaId) {
  const venta = await repo.findVentaById(empresaId, ventaId);
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (venta.estado === 'ANULADA') {
    const err = new Error('La venta ya está anulada');
    err.statusCode = 400;
    throw err;
  }

  const detalle = await repo.getVentaDetalleSimple(empresaId, ventaId);

  for (const item of detalle) {
    const cantidad = Number(item.cantidad);
    const costo_unitario = Number(item.costo_unitario || 0);
    const precio_unitario = Number(item.precio_unitario || 0);

    let inv = await repo.findInventarioRow(empresaId, venta.sucursal_id, item.producto_id);

    if (!inv) {
      const stockInicial = cantidad;
      const invId = await repo.insertInventarioRow(venta.sucursal_id, item.producto_id, stockInicial, 0);
      inv = {
        id: invId,
        sucursal_id: venta.sucursal_id,
        producto_id: item.producto_id,
        stock_actual: stockInicial
      };
    } else {
      const nuevoStock = Number(inv.stock_actual) + cantidad;
      await repo.updateInventarioStock(venta.sucursal_id, item.producto_id, nuevoStock);
      inv.stock_actual = nuevoStock;
    }

    await repo.insertMovimientoInventario({
      empresa_id: empresaId,
      sucursal_id: venta.sucursal_id,
      producto_id: item.producto_id,
      tipo: 'ENTRADA',
      motivo: 'DEVOLUCION_CLIENTE',
      referencia_tipo: 'VENTA',
      referencia_id: ventaId,
      cantidad,
      costo_unitario,
      precio_unitario,
      stock_despues: inv.stock_actual,
      fecha_movimiento: venta.fecha_venta,
      usuario_id: usuarioId
    });
  }

  await repo.marcarVentaAnulada(empresaId, ventaId);

  return true;
}

function parseMetodoPago(value) {
  const allowed = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO'];
  if (!value || typeof value !== 'string') return 'EFECTIVO';
  const upper = value.toUpperCase();
  return allowed.includes(upper) ? upper : 'EFECTIVO';
}

async function listPagos(empresaId, ventaId) {
  const venta = await repo.findVentaById(empresaId, ventaId);
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.statusCode = 404;
    throw err;
  }

  return repo.listPagosByVenta(empresaId, ventaId);
}

async function registrarPago(empresaId, ventaId, data, usuarioId) {
  const venta = await repo.findVentaById(empresaId, ventaId);
  if (!venta) {
    const err = new Error('Venta no encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (venta.tipo_venta !== 'CREDITO') {
    const err = new Error('Solo se pueden registrar pagos para ventas a crédito');
    err.statusCode = 400;
    throw err;
  }

  if (venta.estado === 'ANULADA') {
    const err = new Error('No se pueden registrar pagos para una venta anulada');
    err.statusCode = 400;
    throw err;
  }

  if (!data.fecha_pago) {
    const err = new Error('fecha_pago es requerido');
    err.statusCode = 400;
    throw err;
  }

  if (data.monto === undefined || data.monto === null) {
    const err = new Error('monto es requerido');
    err.statusCode = 400;
    throw err;
  }

  const monto = Number(data.monto);
  if (Number.isNaN(monto) || monto <= 0) {
    const err = new Error('monto debe ser un número mayor a 0');
    err.statusCode = 400;
    throw err;
  }

  if (monto > Number(venta.saldo_pendiente)) {
    const err = new Error('El monto del pago no puede ser mayor al saldo pendiente');
    err.statusCode = 400;
    throw err;
  }

  const pagoData = {
    fecha_pago: data.fecha_pago,
    monto,
    metodo_pago: parseMetodoPago(data.metodo_pago),
    referencia_pago: data.referencia_pago,
    observaciones: data.observaciones
  };

  await repo.createPagoCliente(empresaId, venta, pagoData, usuarioId);

  const saldoActual = Number(venta.saldo_pendiente);
  const nuevoSaldo = Number((saldoActual - monto).toFixed(2));

  let nuevoEstado = 'PARCIAL';
  if (nuevoSaldo <= 0) {
    nuevoEstado = 'PAGADA';
  }

  await repo.updateVentaSaldoYEstado(empresaId, ventaId, nuevoSaldo < 0 ? 0 : nuevoSaldo, nuevoEstado);

  return {
    nuevoSaldo: nuevoSaldo < 0 ? 0 : nuevoSaldo,
    nuevoEstado
  };
}

module.exports = {
  listVentas,
  detailVenta,
  createVenta,
  anularVenta,
  listPagos,
  registrarPago
};
