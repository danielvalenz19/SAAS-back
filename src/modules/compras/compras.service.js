// src/modules/compras/compras.service.js
const repo = require('./compras.repository');

function parseIntOrUndefined(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

function parseMetodoPago(value) {
  const allowed = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO'];
  if (!value || typeof value !== 'string') return 'EFECTIVO';
  const up = value.toUpperCase();
  return allowed.includes(up) ? up : 'EFECTIVO';
}

function validarTipoCompra(tipo_compra) {
  const allowed = ['CONTADO', 'CREDITO'];
  if (!tipo_compra) return 'CONTADO';
  const up = tipo_compra.toUpperCase();
  if (!allowed.includes(up)) {
    const err = new Error('tipo_compra inválido (CONTADO | CREDITO)');
    err.statusCode = 400;
    throw err;
  }
  return up;
}

function calcularTotales(items, tipo_compra) {
  let total_bruto = 0;
  let descuento_total = 0;

  for (const it of items) {
    const cantidad = Number(it.cantidad);
    const costo = Number(it.costo_unitario);
    const desc = Number(it.descuento || 0);

    if (Number.isNaN(cantidad) || cantidad <= 0) {
      const err = new Error('Cantidad inválida en un item');
      err.statusCode = 400;
      throw err;
    }
    if (Number.isNaN(costo) || costo < 0) {
      const err = new Error('costo_unitario inválido en un item');
      err.statusCode = 400;
      throw err;
    }
    if (Number.isNaN(desc) || desc < 0) {
      const err = new Error('descuento inválido en un item');
      err.statusCode = 400;
      throw err;
    }

    total_bruto += cantidad * costo;
    descuento_total += desc;
  }

  const total_neto = Number((total_bruto - descuento_total).toFixed(2));
  let saldo_pendiente = 0;
  let estado = 'PAGADA';

  if (tipo_compra === 'CREDITO') {
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

async function listCompras(empresaId, filtersRaw) {
  const filters = {
    proveedor_id: parseIntOrUndefined(filtersRaw.proveedor_id),
    sucursal_id: parseIntOrUndefined(filtersRaw.sucursal_id),
    tipo_compra: filtersRaw.tipo_compra || undefined,
    estado: filtersRaw.estado || undefined,
    fecha_desde: filtersRaw.fecha_desde || undefined,
    fecha_hasta: filtersRaw.fecha_hasta || undefined
  };

  return repo.listCompras(empresaId, filters);
}

async function detailCompra(empresaId, compraId) {
  const compra = await repo.findCompraById(empresaId, compraId);
  if (!compra) {
    const err = new Error('Compra no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const detalle = await repo.getCompraDetalle(empresaId, compraId);

  return { compra, detalle };
}

async function createCompra(empresaId, usuarioId, data) {
  if (!data.sucursal_id) {
    const err = new Error('sucursal_id es requerido');
    err.statusCode = 400;
    throw err;
  }
  if (!data.proveedor_id) {
    const err = new Error('proveedor_id es requerido');
    err.statusCode = 400;
    throw err;
  }
  if (!data.fecha_compra) {
    const err = new Error('fecha_compra es requerida');
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    const err = new Error('Se requiere al menos un item en la compra');
    err.statusCode = 400;
    throw err;
  }

  const sucursal = await repo.findSucursalById(empresaId, data.sucursal_id);
  if (!sucursal) {
    const err = new Error('La sucursal no existe en esta empresa');
    err.statusCode = 400;
    throw err;
  }

  const proveedor = await repo.findProveedorById(empresaId, data.proveedor_id);
  if (!proveedor) {
    const err = new Error('El proveedor no existe en esta empresa');
    err.statusCode = 400;
    throw err;
  }
  if (proveedor.activo === 0) {
    const err = new Error('El proveedor está inactivo');
    err.statusCode = 400;
    throw err;
  }

  const tipo_compra = validarTipoCompra(data.tipo_compra);

  if (tipo_compra === 'CREDITO' && !data.fecha_vencimiento) {
    const err = new Error('fecha_vencimiento es requerida para compras a crédito');
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
      const prod = await repo.findProductoForCompra(empresaId, prodId);
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

  const totales = calcularTotales(data.items, tipo_compra);

  const compraId = await repo.createCompra(
    empresaId,
    usuarioId,
    {
      sucursal_id: data.sucursal_id,
      proveedor_id: data.proveedor_id,
      tipo_compra,
      fecha_compra: data.fecha_compra,
      fecha_vencimiento: data.fecha_vencimiento,
      numero_factura: data.numero_factura,
      observaciones: data.observaciones
    },
    totales
  );

  for (const item of data.items) {
    await repo.createCompraDetalle(compraId, item);

    const cantidad = Number(item.cantidad);
    const costo_unitario = Number(item.costo_unitario);

    let inv = await repo.findInventarioRow(empresaId, data.sucursal_id, item.producto_id);

    const prodInfo = productosCache.get(item.producto_id);
    const stockMin = Number(prodInfo.stock_minimo_general || 0);

    if (!inv) {
      const stockInicial = cantidad;
      const invId = await repo.insertInventarioRow(
        data.sucursal_id,
        item.producto_id,
        stockInicial,
        stockMin
      );
      inv = {
        id: invId,
        sucursal_id: data.sucursal_id,
        producto_id: item.producto_id,
        stock_actual: stockInicial
      };
    } else {
      const nuevoStock = Number(inv.stock_actual) + cantidad;
      await repo.updateInventarioStock(data.sucursal_id, item.producto_id, nuevoStock);
      inv.stock_actual = nuevoStock;
    }

    await repo.insertMovimientoInventario({
      empresa_id: empresaId,
      sucursal_id: data.sucursal_id,
      producto_id: item.producto_id,
      tipo: 'ENTRADA',
      motivo: 'COMPRA',
      referencia_tipo: 'COMPRA',
      referencia_id: compraId,
      cantidad,
      costo_unitario,
      precio_unitario: null,
      stock_despues: inv.stock_actual,
      fecha_movimiento: data.fecha_compra,
      usuario_id: usuarioId
    });
  }

  return compraId;
}

async function anularCompra(empresaId, usuarioId, compraId) {
  const compra = await repo.findCompraById(empresaId, compraId);
  if (!compra) {
    const err = new Error('Compra no encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (compra.estado === 'ANULADA') {
    const err = new Error('La compra ya está anulada');
    err.statusCode = 400;
    throw err;
  }

  const detalle = await repo.getCompraDetalleSimple(empresaId, compraId);

  for (const item of detalle) {
    const cantidad = Number(item.cantidad);
    const costo_unitario = Number(item.costo_unitario || 0);

    let inv = await repo.findInventarioRow(
      empresaId,
      compra.sucursal_id,
      item.producto_id
    );

    if (!inv) {
      const stockInicial = 0 - cantidad;
      const invId = await repo.insertInventarioRow(
        compra.sucursal_id,
        item.producto_id,
        stockInicial,
        0
      );
      inv = {
        id: invId,
        sucursal_id: compra.sucursal_id,
        producto_id: item.producto_id,
        stock_actual: stockInicial
      };
    } else {
      const nuevoStock = Number(inv.stock_actual) - cantidad;
      await repo.updateInventarioStock(
        compra.sucursal_id,
        item.producto_id,
        nuevoStock
      );
      inv.stock_actual = nuevoStock;
    }

    await repo.insertMovimientoInventario({
      empresa_id: empresaId,
      sucursal_id: compra.sucursal_id,
      producto_id: item.producto_id,
      tipo: 'SALIDA',
      motivo: 'DEVOLUCION_PROVEEDOR',
      referencia_tipo: 'COMPRA',
      referencia_id: compraId,
      cantidad,
      costo_unitario,
      precio_unitario: null,
      stock_despues: inv.stock_actual,
      fecha_movimiento: compra.fecha_compra,
      usuario_id: usuarioId
    });
  }

  await repo.marcarCompraAnulada(empresaId, compraId);

  return true;
}

async function listPagos(empresaId, compraId) {
  const compra = await repo.findCompraById(empresaId, compraId);
  if (!compra) {
    const err = new Error('Compra no encontrada');
    err.statusCode = 404;
    throw err;
  }

  return repo.listPagosByCompra(empresaId, compraId);
}

async function registrarPago(empresaId, compraId, data, usuarioId) {
  const compra = await repo.findCompraById(empresaId, compraId);
  if (!compra) {
    const err = new Error('Compra no encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (compra.tipo_compra !== 'CREDITO') {
    const err = new Error('Solo se pueden registrar pagos para compras a crédito');
    err.statusCode = 400;
    throw err;
  }

  if (compra.estado === 'ANULADA') {
    const err = new Error('No se pueden registrar pagos para una compra anulada');
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

  if (monto > Number(compra.saldo_pendiente)) {
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

  await repo.createPagoProveedor(empresaId, compra, pagoData, usuarioId);

  const saldoActual = Number(compra.saldo_pendiente);
  const nuevoSaldo = Number((saldoActual - monto).toFixed(2));

  let nuevoEstado = 'PARCIAL';
  if (nuevoSaldo <= 0) {
    nuevoEstado = 'PAGADA';
  }

  await repo.updateCompraSaldoYEstado(
    empresaId,
    compraId,
    nuevoSaldo < 0 ? 0 : nuevoSaldo,
    nuevoEstado
  );

  return {
    nuevoSaldo: nuevoSaldo < 0 ? 0 : nuevoSaldo,
    nuevoEstado
  };
}

module.exports = {
  listCompras,
  detailCompra,
  createCompra,
  anularCompra,
  listPagos,
  registrarPago
};
