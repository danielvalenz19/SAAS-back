// src/modules/productos/productos.service.js
const repo = require('./productos.repository');

function parseEsActivo(value) {
  if (value === undefined || value === null) return undefined;
  if (value === '0' || value === 0 || value === false || value === 'false') return 0;
  return 1;
}

function parseNumberOrUndefined(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

async function list(empresaId, filters) {
  const parsedFilters = {
    search: filters.search,
    categoria_id: parseNumberOrUndefined(filters.categoria_id),
    es_activo: parseEsActivo(filters.es_activo),
    sucursal_id: parseNumberOrUndefined(filters.sucursal_id)
  };

  return repo.listProducts(empresaId, parsedFilters);
}

function calcularMargen(precio_compra_referencia, precio_venta, margen_existente) {
  if (margen_existente !== undefined && margen_existente !== null) {
    return margen_existente;
  }
  if (!precio_compra_referencia || !precio_venta || precio_compra_referencia === 0) {
    return 0;
  }
  const margen = ((precio_venta - precio_compra_referencia) / precio_compra_referencia) * 100;
  return Number(margen.toFixed(2));
}

async function create(empresaId, data) {
  if (!data.nombre) {
    const err = new Error('El nombre del producto es requerido');
    err.statusCode = 400;
    throw err;
  }

  if (!data.unidad_medida_id) {
    const err = new Error('unidad_medida_id es requerido');
    err.statusCode = 400;
    throw err;
  }

  let precio_compra_referencia = data.precio_compra_referencia;
  if (precio_compra_referencia === undefined || precio_compra_referencia === null) {
    precio_compra_referencia = data.precio_costo;
  }

  if (precio_compra_referencia === undefined || precio_compra_referencia === null) {
    const err = new Error('precio_compra_referencia es requerido');
    err.statusCode = 400;
    throw err;
  }

  if (data.precio_venta === undefined || data.precio_venta === null) {
    const err = new Error('precio_venta es requerido');
    err.statusCode = 400;
    throw err;
  }

  if (data.categoria_id) {
    const categoria = await repo.findCategoriaById(empresaId, data.categoria_id);
    if (!categoria) {
      const err = new Error('La categoría no existe en esta empresa');
      err.statusCode = 400;
      throw err;
    }
  }

  const unidad = await repo.findUnidadMedidaById(empresaId, data.unidad_medida_id);
  if (!unidad) {
    const err = new Error('La unidad de medida no existe en esta empresa');
    err.statusCode = 400;
    throw err;
  }

  const precioCompraNum = Number(precio_compra_referencia);
  const precioVentaNum = Number(data.precio_venta);

  if (Number.isNaN(precioCompraNum) || Number.isNaN(precioVentaNum)) {
    const err = new Error('precio_compra_referencia y precio_venta deben ser numéricos');
    err.statusCode = 400;
    throw err;
  }

  const margen_utilidad = calcularMargen(precioCompraNum, precioVentaNum, data.margen_utilidad);

  const stockMinimoGeneral =
    data.stock_minimo_general !== undefined && data.stock_minimo_general !== null
      ? Number(data.stock_minimo_general)
      : 0;

  const productoId = await repo.createProduct(empresaId, {
    categoria_id: data.categoria_id,
    unidad_medida_id: data.unidad_medida_id,
    codigo_sku: data.codigo_sku,
    codigo_barras: data.codigo_barras,
    nombre: data.nombre,
    descripcion: data.descripcion,
    precio_compra_referencia: precioCompraNum,
    precio_venta: precioVentaNum,
    margen_utilidad,
    stock_minimo_general: stockMinimoGeneral,
    es_activo: parseEsActivo(data.es_activo) ?? 1,
    es_servicio: data.es_servicio ? 1 : 0
  });

  await repo.createInventarioInicial(empresaId, productoId, stockMinimoGeneral);

  return productoId;
}

async function detail(empresaId, id) {
  return repo.findProductById(empresaId, id);
}

async function update(empresaId, id, data) {
  const allowed = [
    'categoria_id',
    'unidad_medida_id',
    'nombre',
    'descripcion',
    'codigo_barras',
    'codigo_sku',
    'precio_compra_referencia',
    'precio_venta',
    'margen_utilidad',
    'es_servicio',
    'stock_minimo_general'
  ];

  const updateData = Object.keys(data || {})
    .filter((k) => allowed.includes(k))
    .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {});

  if (data.precio_costo !== undefined && data.precio_compra_referencia === undefined) {
    updateData.precio_compra_referencia = data.precio_costo;
  }

  if (updateData.categoria_id) {
    const categoria = await repo.findCategoriaById(empresaId, updateData.categoria_id);
    if (!categoria) {
      const err = new Error('La categoría no existe en esta empresa');
      err.statusCode = 400;
      throw err;
    }
  }

  if (updateData.unidad_medida_id) {
    const unidad = await repo.findUnidadMedidaById(empresaId, updateData.unidad_medida_id);
    if (!unidad) {
      const err = new Error('La unidad de medida no existe en esta empresa');
      err.statusCode = 400;
      throw err;
    }
  }

  if (
    updateData.precio_compra_referencia !== undefined ||
    updateData.precio_venta !== undefined ||
    updateData.margen_utilidad !== undefined
  ) {
    const actual = await repo.findProductById(empresaId, id);
    if (!actual) {
      const err = new Error('Producto no encontrado');
      err.statusCode = 404;
      throw err;
    }

    const precioCompraNum =
      updateData.precio_compra_referencia !== undefined
        ? Number(updateData.precio_compra_referencia)
        : Number(actual.precio_compra_referencia);

    const precioVentaNum =
      updateData.precio_venta !== undefined ? Number(updateData.precio_venta) : Number(actual.precio_venta);

    const margen = calcularMargen(precioCompraNum, precioVentaNum, updateData.margen_utilidad);

    updateData.precio_compra_referencia = precioCompraNum;
    updateData.precio_venta = precioVentaNum;
    updateData.margen_utilidad = margen;
  }

  if (Object.keys(updateData).length === 0) {
    const err = new Error('No hay campos válidos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  const updated = await repo.updateProduct(empresaId, id, updateData);
  if (!updated) {
    const err = new Error('Producto no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return true;
}

async function changeEstado(empresaId, id, es_activo) {
  const parsed = parseEsActivo(es_activo);
  if (parsed === undefined) {
    const err = new Error('El estado es_activo es requerido (1 o 0)');
    err.statusCode = 400;
    throw err;
  }

  const updated = await repo.updateEstado(empresaId, id, parsed);
  if (!updated) {
    const err = new Error('Producto no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return true;
}

async function getInventario(empresaId, productoId) {
  const producto = await repo.findProductById(empresaId, productoId);
  if (!producto) {
    const err = new Error('Producto no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return repo.getInventarioByProducto(empresaId, productoId);
}

async function getStockBajo(empresaId, filters) {
  const sucursal_id = parseNumberOrUndefined(filters.sucursal_id);
  const limite = parseNumberOrUndefined(filters.limite);

  if (!sucursal_id) {
    const err = new Error('sucursal_id es requerido');
    err.statusCode = 400;
    throw err;
  }

  return repo.getStockBajo(empresaId, { sucursal_id, limite });
}

async function importacionMasiva(empresaId, productos) {
  if (!Array.isArray(productos) || !productos.length) {
    const err = new Error('Se requiere un arreglo de productos');
    err.statusCode = 400;
    throw err;
  }

  const ids = [];
  for (const item of productos) {
    const id = await create(empresaId, item);
    ids.push(id);
  }

  return ids;
}

module.exports = {
  list,
  create,
  detail,
  update,
  changeEstado,
  getInventario,
  getStockBajo,
  importacionMasiva
};
