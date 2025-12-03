// src/modules/compras/compras.repository.js
const { getPool } = require('../../config/db');

async function listCompras(empresaId, filters) {
  const pool = getPool();
  const params = [empresaId];

  let query = `
    SELECT
      c.id,
      c.empresa_id,
      c.sucursal_id,
      s.nombre AS sucursal_nombre,
      c.proveedor_id,
      p.nombre AS proveedor_nombre,
      c.usuario_id,
      c.tipo_compra,
      c.fecha_compra,
      c.fecha_vencimiento,
      c.numero_factura,
      c.total_bruto,
      c.descuento_total,
      c.total_neto,
      c.saldo_pendiente,
      c.estado,
      c.observaciones,
      c.created_at,
      c.updated_at
    FROM compras c
    JOIN sucursales s
      ON s.id = c.sucursal_id
     AND s.empresa_id = c.empresa_id
    JOIN proveedores p
      ON p.id = c.proveedor_id
     AND p.empresa_id = c.empresa_id
    WHERE c.empresa_id = ?
  `;

  if (filters.proveedor_id) {
    query += ' AND c.proveedor_id = ?';
    params.push(filters.proveedor_id);
  }

  if (filters.sucursal_id) {
    query += ' AND c.sucursal_id = ?';
    params.push(filters.sucursal_id);
  }

  if (filters.tipo_compra) {
    query += ' AND c.tipo_compra = ?';
    params.push(filters.tipo_compra);
  }

  if (filters.estado) {
    query += ' AND c.estado = ?';
    params.push(filters.estado);
  }

  if (filters.fecha_desde) {
    query += ' AND c.fecha_compra >= ?';
    params.push(filters.fecha_desde);
  }

  if (filters.fecha_hasta) {
    query += ' AND c.fecha_compra <= ?';
    params.push(filters.fecha_hasta);
  }

  query += ' ORDER BY c.fecha_compra DESC, c.id DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function findCompraById(empresaId, compraId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      c.id,
      c.empresa_id,
      c.sucursal_id,
      s.nombre AS sucursal_nombre,
      c.proveedor_id,
      p.nombre AS proveedor_nombre,
      c.usuario_id,
      c.tipo_compra,
      c.fecha_compra,
      c.fecha_vencimiento,
      c.numero_factura,
      c.total_bruto,
      c.descuento_total,
      c.total_neto,
      c.saldo_pendiente,
      c.estado,
      c.observaciones,
      c.created_at,
      c.updated_at
    FROM compras c
    JOIN sucursales s
      ON s.id = c.sucursal_id
     AND s.empresa_id = c.empresa_id
    JOIN proveedores p
      ON p.id = c.proveedor_id
     AND p.empresa_id = c.empresa_id
    WHERE c.empresa_id = ? AND c.id = ?
    `,
    [empresaId, compraId]
  );
  return rows[0];
}

async function getCompraDetalle(empresaId, compraId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      d.id,
      d.compra_id,
      d.producto_id,
      p.nombre AS producto_nombre,
      d.unidad_medida_id,
      u.nombre AS unidad_nombre,
      d.cantidad,
      d.costo_unitario,
      d.descuento,
      d.subtotal,
      d.created_at,
      d.updated_at
    FROM compra_detalle d
    JOIN compras c
      ON c.id = d.compra_id
     AND c.empresa_id = ?
    JOIN productos p
      ON p.id = d.producto_id
    JOIN unidades_medida u
      ON u.id = d.unidad_medida_id
    WHERE d.compra_id = ?
    ORDER BY d.id ASC
    `,
    [empresaId, compraId]
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

async function findProveedorById(empresaId, proveedorId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT id, empresa_id, nombre, activo
    FROM proveedores
    WHERE empresa_id = ? AND id = ?
    `,
    [empresaId, proveedorId]
  );
  return rows[0];
}

async function findProductoForCompra(empresaId, productoId) {
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
      es_servicio,
      stock_minimo_general
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

async function createCompra(empresaId, usuarioId, data, totales) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    INSERT INTO compras (
      empresa_id,
      sucursal_id,
      proveedor_id,
      usuario_id,
      tipo_compra,
      fecha_compra,
      fecha_vencimiento,
      numero_factura,
      total_bruto,
      descuento_total,
      total_neto,
      saldo_pendiente,
      estado,
      observaciones,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      empresaId,
      data.sucursal_id,
      data.proveedor_id,
      usuarioId,
      data.tipo_compra,
      data.fecha_compra,
      data.fecha_vencimiento || null,
      data.numero_factura || null,
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

async function createCompraDetalle(compraId, item) {
  const pool = getPool();
  const cantidad = Number(item.cantidad);
  const costo_unitario = Number(item.costo_unitario);
  const descuento = Number(item.descuento || 0);
  const subtotal = Number((cantidad * costo_unitario - descuento).toFixed(2));

  await pool.query(
    `
    INSERT INTO compra_detalle (
      compra_id,
      producto_id,
      unidad_medida_id,
      cantidad,
      costo_unitario,
      descuento,
      subtotal,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      compraId,
      item.producto_id,
      item.unidad_medida_id,
      cantidad,
      costo_unitario,
      descuento,
      subtotal
    ]
  );
}

async function listPagosByCompra(empresaId, compraId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      id,
      empresa_id,
      compra_id,
      proveedor_id,
      fecha_pago,
      monto,
      metodo_pago,
      referencia_pago,
      usuario_id,
      observaciones,
      created_at
    FROM pagos_proveedor
    WHERE empresa_id = ?
      AND compra_id = ?
    ORDER BY fecha_pago ASC, id ASC
    `,
    [empresaId, compraId]
  );
  return rows;
}

async function createPagoProveedor(empresaId, compra, data, usuarioId) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    INSERT INTO pagos_proveedor (
      empresa_id,
      compra_id,
      proveedor_id,
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
      compra.id,
      compra.proveedor_id,
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

async function updateCompraSaldoYEstado(empresaId, compraId, nuevoSaldo, nuevoEstado) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    UPDATE compras
    SET saldo_pendiente = ?, estado = ?, updated_at = NOW()
    WHERE empresa_id = ? AND id = ?
    `,
    [nuevoSaldo, nuevoEstado, empresaId, compraId]
  );
  return result.affectedRows > 0;
}

async function marcarCompraAnulada(empresaId, compraId) {
  const pool = getPool();
  await pool.query(
    `
    UPDATE compras
    SET estado = 'ANULADA', saldo_pendiente = 0, updated_at = NOW()
    WHERE empresa_id = ? AND id = ?
    `,
    [empresaId, compraId]
  );
}

async function getCompraDetalleSimple(empresaId, compraId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      d.id,
      d.compra_id,
      d.producto_id,
      d.unidad_medida_id,
      d.cantidad,
      d.costo_unitario
    FROM compra_detalle d
    JOIN compras c
      ON c.id = d.compra_id
     AND c.empresa_id = ?
    WHERE d.compra_id = ?
    `,
    [empresaId, compraId]
  );
  return rows;
}

module.exports = {
  listCompras,
  findCompraById,
  getCompraDetalle,
  createCompra,
  createCompraDetalle,
  findSucursalById,
  findProveedorById,
  findProductoForCompra,
  findInventarioRow,
  insertInventarioRow,
  updateInventarioStock,
  insertMovimientoInventario,
  listPagosByCompra,
  createPagoProveedor,
  updateCompraSaldoYEstado,
  marcarCompraAnulada,
  getCompraDetalleSimple
};
