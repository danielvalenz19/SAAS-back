// src/modules/ventas/ventas.repository.js
const { getPool } = require('../../config/db');

async function listVentas(empresaId, filters) {
  const pool = getPool();
  const params = [empresaId];

  let query = `
    SELECT
      v.id,
      v.empresa_id,
      v.sucursal_id,
      s.nombre AS sucursal_nombre,
      v.cliente_id,
      c.nombre AS cliente_nombre,
      v.usuario_id,
      v.tipo_venta,
      v.fecha_venta,
      v.fecha_vencimiento,
      v.total_bruto,
      v.descuento_total,
      v.total_neto,
      v.saldo_pendiente,
      v.estado,
      v.observaciones,
      v.created_at,
      v.updated_at
    FROM ventas v
    LEFT JOIN clientes c
      ON c.id = v.cliente_id
     AND c.empresa_id = v.empresa_id
    LEFT JOIN sucursales s
      ON s.id = v.sucursal_id
     AND s.empresa_id = v.empresa_id
    WHERE v.empresa_id = ?
  `;

  if (filters.cliente_id) {
    query += ' AND v.cliente_id = ?';
    params.push(filters.cliente_id);
  }

  if (filters.sucursal_id) {
    query += ' AND v.sucursal_id = ?';
    params.push(filters.sucursal_id);
  }

  if (filters.tipo_venta) {
    query += ' AND v.tipo_venta = ?';
    params.push(filters.tipo_venta);
  }

  if (filters.estado) {
    query += ' AND v.estado = ?';
    params.push(filters.estado);
  }

  if (filters.fecha_desde) {
    query += ' AND v.fecha_venta >= ?';
    params.push(filters.fecha_desde);
  }

  if (filters.fecha_hasta) {
    query += ' AND v.fecha_venta <= ?';
    params.push(filters.fecha_hasta);
  }

  query += ' ORDER BY v.fecha_venta DESC, v.id DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function findVentaById(empresaId, ventaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      v.id,
      v.empresa_id,
      v.sucursal_id,
      s.nombre AS sucursal_nombre,
      v.cliente_id,
      c.nombre AS cliente_nombre,
      v.usuario_id,
      v.tipo_venta,
      v.fecha_venta,
      v.fecha_vencimiento,
      v.total_bruto,
      v.descuento_total,
      v.total_neto,
      v.saldo_pendiente,
      v.estado,
      v.observaciones,
      v.created_at,
      v.updated_at
    FROM ventas v
    LEFT JOIN clientes c
      ON c.id = v.cliente_id
     AND c.empresa_id = v.empresa_id
    LEFT JOIN sucursales s
      ON s.id = v.sucursal_id
     AND s.empresa_id = v.empresa_id
    WHERE v.empresa_id = ?
      AND v.id = ?
    `,
    [empresaId, ventaId]
  );
  return rows[0];
}

async function getVentaDetalle(empresaId, ventaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      d.id,
      d.venta_id,
      d.producto_id,
      p.nombre AS producto_nombre,
      d.unidad_medida_id,
      u.nombre AS unidad_nombre,
      d.cantidad,
      d.precio_unitario,
      d.descuento,
      d.subtotal,
      d.costo_unitario,
      d.created_at,
      d.updated_at
    FROM venta_detalle d
    JOIN ventas v
      ON v.id = d.venta_id
     AND v.empresa_id = ?
    JOIN productos p
      ON p.id = d.producto_id
    JOIN unidades_medida u
      ON u.id = d.unidad_medida_id
    WHERE d.venta_id = ?
    ORDER BY d.id ASC
    `,
    [empresaId, ventaId]
  );
  return rows;
}

async function findSucursalById(empresaId, sucursalId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT id, empresa_id, nombre
    FROM sucursales
    WHERE empresa_id = ? AND id = ?
    `,
    [empresaId, sucursalId]
  );
  return rows[0];
}

async function findProductoForVenta(empresaId, productoId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      id,
      empresa_id,
      nombre,
      precio_compra_referencia,
      precio_venta,
      es_activo,
      es_servicio
    FROM productos
    WHERE empresa_id = ? AND id = ?
    `,
    [empresaId, productoId]
  );
  return rows[0];
}

async function findInventarioRow(empresaId, sucursalId, productoId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      i.id,
      i.sucursal_id,
      i.producto_id,
      i.stock_actual,
      i.stock_minimo,
      i.stock_maximo,
      i.created_at,
      i.updated_at
    FROM inventario_sucursal i
    JOIN sucursales s
      ON s.id = i.sucursal_id
    WHERE s.empresa_id = ?
      AND i.sucursal_id = ?
      AND i.producto_id = ?
    `,
    [empresaId, sucursalId, productoId]
  );
  return rows[0];
}

async function insertInventarioRow(sucursalId, productoId, stockInicial, stockMinimo) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    INSERT INTO inventario_sucursal (
      sucursal_id,
      producto_id,
      stock_actual,
      stock_minimo,
      stock_maximo,
      created_at
    ) VALUES (?, ?, ?, ?, NULL, NOW())
    `,
    [sucursalId, productoId, stockInicial, stockMinimo || 0]
  );
  return result.insertId;
}

async function updateInventarioStock(sucursalId, productoId, nuevoStock) {
  const pool = getPool();
  await pool.query(
    `
    UPDATE inventario_sucursal
    SET stock_actual = ?, updated_at = NOW()
    WHERE sucursal_id = ? AND producto_id = ?
    `,
    [nuevoStock, sucursalId, productoId]
  );
}

async function insertMovimientoInventario({
  empresa_id,
  sucursal_id,
  producto_id,
  tipo,
  motivo,
  referencia_tipo,
  referencia_id,
  cantidad,
  costo_unitario,
  precio_unitario,
  stock_despues,
  fecha_movimiento,
  usuario_id
}) {
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO movimientos_inventario (
      empresa_id,
      sucursal_id,
      producto_id,
      tipo,
      motivo,
      referencia_tipo,
      referencia_id,
      cantidad,
      costo_unitario,
      precio_unitario,
      stock_despues,
      fecha_movimiento,
      usuario_id,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      empresa_id,
      sucursal_id,
      producto_id,
      tipo,
      motivo,
      referencia_tipo,
      referencia_id,
      cantidad,
      costo_unitario,
      precio_unitario,
      stock_despues,
      fecha_movimiento,
      usuario_id
    ]
  );
}

async function createVenta(empresaId, usuarioId, data, totales) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    INSERT INTO ventas (
      empresa_id,
      sucursal_id,
      cliente_id,
      usuario_id,
      tipo_venta,
      fecha_venta,
      fecha_vencimiento,
      total_bruto,
      descuento_total,
      total_neto,
      saldo_pendiente,
      estado,
      observaciones,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      empresaId,
      data.sucursal_id,
      data.cliente_id || null,
      usuarioId,
      data.tipo_venta,
      data.fecha_venta,
      data.fecha_vencimiento || null,
      totales.total_bruto,
      totales.descuento_total,
      totales.total_neto,
      totales.saldo_pendiente,
      totales.estado,
      data.observaciones || null
    ]
  );

  return result.insertId;
}

async function createVentaDetalle(ventaId, item, costo_unitario) {
  const pool = getPool();

  const subtotal = Number((item.cantidad * item.precio_unitario - (item.descuento || 0)).toFixed(2));

  await pool.query(
    `
    INSERT INTO venta_detalle (
      venta_id,
      producto_id,
      unidad_medida_id,
      cantidad,
      precio_unitario,
      descuento,
      subtotal,
      costo_unitario,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      ventaId,
      item.producto_id,
      item.unidad_medida_id,
      item.cantidad,
      item.precio_unitario,
      item.descuento || 0,
      subtotal,
      costo_unitario || 0
    ]
  );
}

async function listPagosByVenta(empresaId, ventaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      id,
      empresa_id,
      venta_id,
      cliente_id,
      fecha_pago,
      monto,
      metodo_pago,
      referencia_pago,
      usuario_id,
      observaciones,
      created_at
    FROM pagos_cliente
    WHERE empresa_id = ?
      AND venta_id = ?
    ORDER BY fecha_pago ASC, id ASC
    `,
    [empresaId, ventaId]
  );
  return rows;
}

async function createPagoCliente(empresaId, venta, data, usuarioId) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    INSERT INTO pagos_cliente (
      empresa_id,
      venta_id,
      cliente_id,
      fecha_pago,
      monto,
      metodo_pago,
      referencia_pago,
      usuario_id,
      observaciones,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      empresaId,
      venta.id,
      venta.cliente_id,
      data.fecha_pago,
      data.monto,
      data.metodo_pago,
      data.referencia_pago || null,
      usuarioId,
      data.observaciones || null
    ]
  );

  return result.insertId;
}

async function updateVentaSaldoYEstado(empresaId, ventaId, nuevoSaldo, nuevoEstado) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    UPDATE ventas
    SET saldo_pendiente = ?, estado = ?, updated_at = NOW()
    WHERE empresa_id = ? AND id = ?
    `,
    [nuevoSaldo, nuevoEstado, empresaId, ventaId]
  );
  return result.affectedRows > 0;
}

async function marcarVentaAnulada(empresaId, ventaId) {
  const pool = getPool();
  await pool.query(
    `
    UPDATE ventas
    SET estado = 'ANULADA', saldo_pendiente = 0, updated_at = NOW()
    WHERE empresa_id = ? AND id = ?
    `,
    [empresaId, ventaId]
  );
}

async function getVentaDetalleSimple(empresaId, ventaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      d.id,
      d.venta_id,
      d.producto_id,
      d.unidad_medida_id,
      d.cantidad,
      d.precio_unitario,
      d.costo_unitario
    FROM venta_detalle d
    JOIN ventas v
      ON v.id = d.venta_id
     AND v.empresa_id = ?
    WHERE d.venta_id = ?
    `,
    [empresaId, ventaId]
  );
  return rows;
}

module.exports = {
  listVentas,
  findVentaById,
  getVentaDetalle,
  findSucursalById,
  findProductoForVenta,
  findInventarioRow,
  insertInventarioRow,
  updateInventarioStock,
  insertMovimientoInventario,
  createVenta,
  createVentaDetalle,
  listPagosByVenta,
  createPagoCliente,
  updateVentaSaldoYEstado,
  marcarVentaAnulada,
  getVentaDetalleSimple
};
