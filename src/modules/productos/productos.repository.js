// src/modules/productos/productos.repository.js
const { getPool } = require('../../config/db');

async function listProducts(empresaId, { search, categoria_id, es_activo, sucursal_id }) {
  const pool = getPool();
  const params = [];
  let query = `
    SELECT
      p.id,
      p.empresa_id,
      p.categoria_id,
      p.unidad_medida_id,
      p.nombre,
      p.descripcion,
      p.codigo_barras,
      p.codigo_sku,
      p.precio_compra_referencia,
      p.precio_venta,
      p.margen_utilidad,
      p.stock_minimo_general,
      p.es_activo,
      p.es_servicio,
      p.created_at,
      p.updated_at
  `;

  if (sucursal_id) {
    query += `,
      i.sucursal_id,
      i.stock_actual,
      i.stock_minimo AS stock_minimo_sucursal,
      i.stock_maximo
    `;
  }

  query += `
    FROM productos p
  `;

  if (sucursal_id) {
    query += `
      LEFT JOIN inventario_sucursal i
        ON i.producto_id = p.id
       AND i.sucursal_id = ?
    `;
    params.push(sucursal_id);
  }

  query += `
    WHERE p.empresa_id = ?
  `;
  params.push(empresaId);

  if (categoria_id) {
    query += ' AND p.categoria_id = ?';
    params.push(categoria_id);
  }

  if (es_activo !== undefined && es_activo !== null) {
    query += ' AND p.es_activo = ?';
    params.push(es_activo);
  }

  if (search !== undefined && search !== null && search !== '') {
    query += `
      AND (
        p.nombre LIKE ?
        OR p.descripcion LIKE ?
        OR p.codigo_barras LIKE ?
        OR p.codigo_sku LIKE ?
      )
    `;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  query += ' ORDER BY p.nombre ASC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function findProductById(empresaId, id) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      p.id,
      p.empresa_id,
      p.categoria_id,
      p.unidad_medida_id,
      p.nombre,
      p.descripcion,
      p.codigo_barras,
      p.codigo_sku,
      p.precio_compra_referencia,
      p.precio_venta,
      p.margen_utilidad,
      p.stock_minimo_general,
      p.es_activo,
      p.es_servicio,
      p.created_at,
      p.updated_at
    FROM productos p
    WHERE p.id = ? AND p.empresa_id = ?
    `,
    [id, empresaId]
  );
  return rows[0];
}

async function createProduct(empresaId, data) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    INSERT INTO productos (
      empresa_id,
      categoria_id,
      unidad_medida_id,
      codigo_sku,
      codigo_barras,
      nombre,
      descripcion,
      precio_compra_referencia,
      precio_venta,
      margen_utilidad,
      stock_minimo_general,
      es_activo,
      es_servicio,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      empresaId,
      data.categoria_id || null,
      data.unidad_medida_id,
      data.codigo_sku || null,
      data.codigo_barras || null,
      data.nombre,
      data.descripcion || null,
      data.precio_compra_referencia,
      data.precio_venta,
      data.margen_utilidad || 0,
      data.stock_minimo_general || 0,
      data.es_activo !== undefined ? data.es_activo : 1,
      data.es_servicio ? 1 : 0
    ]
  );

  return result.insertId;
}

async function updateProduct(empresaId, id, fields) {
  const pool = getPool();
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  if (!keys.length) return false;

  const setStr = keys.map((k) => `${k} = ?`).join(', ');

  const [result] = await pool.query(
    `
    UPDATE productos
    SET ${setStr}, updated_at = NOW()
    WHERE id = ? AND empresa_id = ?
    `,
    [...values, id, empresaId]
  );

  return result.affectedRows > 0;
}

async function updateEstado(empresaId, id, es_activo) {
  const pool = getPool();
  const [result] = await pool.query(
    `
    UPDATE productos
    SET es_activo = ?, updated_at = NOW()
    WHERE id = ? AND empresa_id = ?
    `,
    [es_activo, id, empresaId]
  );
  return result.affectedRows > 0;
}

async function getInventarioByProducto(empresaId, productoId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      i.id,
      s.empresa_id,
      i.sucursal_id,
      s.nombre AS sucursal_nombre,
      i.producto_id,
      i.stock_actual,
      i.stock_minimo,
      i.stock_maximo,
      i.created_at,
      i.updated_at
    FROM inventario_sucursal i
    JOIN sucursales s
      ON s.id = i.sucursal_id
    JOIN productos p
      ON p.id = i.producto_id
     AND p.empresa_id = s.empresa_id
    WHERE s.empresa_id = ?
      AND p.id = ?
    ORDER BY s.nombre ASC
    `,
    [empresaId, productoId]
  );
  return rows;
}

async function getStockBajo(empresaId, { sucursal_id, limite }) {
  const pool = getPool();
  const params = [empresaId, sucursal_id];

  let query = `
    SELECT
      p.id AS producto_id,
      p.nombre,
      p.codigo_barras,
      p.codigo_sku,
      p.stock_minimo_general,
      i.sucursal_id,
      i.stock_actual,
      i.stock_minimo AS stock_minimo_sucursal,
      i.stock_maximo
    FROM inventario_sucursal i
    JOIN sucursales s
      ON s.id = i.sucursal_id
    JOIN productos p
      ON p.id = i.producto_id
     AND p.empresa_id = s.empresa_id
    WHERE s.empresa_id = ?
      AND i.sucursal_id = ?
      AND (
        (i.stock_minimo IS NOT NULL AND i.stock_minimo > 0 AND i.stock_actual <= i.stock_minimo)
        OR (i.stock_minimo = 0 AND p.stock_minimo_general > 0 AND i.stock_actual <= p.stock_minimo_general)
      )
    ORDER BY i.stock_actual ASC, p.nombre ASC
  `;

  if (limite && Number(limite) > 0) {
    query += ' LIMIT ?';
    params.push(Number(limite));
  }

  const [rows] = await pool.query(query, params);
  return rows;
}

async function findCategoriaById(empresaId, categoriaId) {
  if (!categoriaId) return null;
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT id, empresa_id, nombre
    FROM categorias
    WHERE id = ? AND empresa_id = ?
    `,
    [categoriaId, empresaId]
  );
  return rows[0];
}

async function findUnidadMedidaById(empresaId, unidadMedidaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT id, empresa_id, nombre
    FROM unidades_medida
    WHERE id = ? AND empresa_id = ?
    `,
    [unidadMedidaId, empresaId]
  );
  return rows[0];
}

async function getSucursalesIdsByEmpresa(empresaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT id
    FROM sucursales
    WHERE empresa_id = ?
    `,
    [empresaId]
  );
  return rows.map((r) => r.id);
}

async function createInventarioInicial(empresaId, productoId, stockMinimoGeneral) {
  const pool = getPool();
  const sucursalesIds = await getSucursalesIdsByEmpresa(empresaId);

  if (!sucursalesIds.length) {
    return;
  }

  const stockMinimo = stockMinimoGeneral !== undefined && stockMinimoGeneral !== null
    ? Number(stockMinimoGeneral)
    : 0;

  const values = sucursalesIds.map((sid) => [
    sid,
    productoId,
    0,
    stockMinimo,
    null,
    new Date()
  ]);

  await pool.query(
    `
    INSERT INTO inventario_sucursal (
      sucursal_id,
      producto_id,
      stock_actual,
      stock_minimo,
      stock_maximo,
      created_at
    )
    VALUES ?
    `,
    [values]
  );
}

module.exports = {
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  updateEstado,
  getInventarioByProducto,
  getStockBajo,
  findCategoriaById,
  findUnidadMedidaById,
  createInventarioInicial
};
