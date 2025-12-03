// src/modules/categorias/categorias.service.js
const repo = require('./categorias.repository');

async function list(empresaId, query) {
  const padreId = query?.padre_id;
  return repo.listCategorias(empresaId, padreId);
}

async function create(empresaId, data) {
  const { nombre, descripcion, categoria_padre_id } = data || {};

  if (!nombre) {
    const err = new Error('El nombre de la categoría es requerido');
    err.statusCode = 400;
    throw err;
  }

  if (categoria_padre_id !== undefined && categoria_padre_id !== null) {
    const padre = await repo.findCategoriaById(categoria_padre_id, empresaId);
    if (!padre) {
      const err = new Error('La categoría padre no existe en esta empresa');
      err.statusCode = 400;
      throw err;
    }
  }

  const id = await repo.createCategoria(empresaId, {
    nombre,
    descripcion,
    categoria_padre_id: categoria_padre_id ?? null
  });

  return id;
}

async function detail(empresaId, id) {
  const categoria = await repo.findCategoriaById(id, empresaId);
  if (!categoria) {
    const err = new Error('Categoría no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return categoria;
}

async function update(empresaId, id, data) {
  const { nombre, descripcion, categoria_padre_id } = data || {};

  const categoria = await repo.findCategoriaById(id, empresaId);
  if (!categoria) {
    const err = new Error('Categoría no encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (categoria_padre_id !== undefined) {
    if (categoria_padre_id === null) {
      // mover a raíz
    } else {
      if (Number(categoria_padre_id) === Number(id)) {
        const err = new Error('La categoría padre no puede ser la misma categoría');
        err.statusCode = 400;
        throw err;
      }
      const padre = await repo.findCategoriaById(categoria_padre_id, empresaId);
      if (!padre) {
        const err = new Error('La categoría padre no existe en esta empresa');
        err.statusCode = 400;
        throw err;
      }
    }
  }

  const fieldsToUpdate = {};
  if (nombre !== undefined) fieldsToUpdate.nombre = nombre;
  if (descripcion !== undefined) fieldsToUpdate.descripcion = descripcion ?? null;
  if (categoria_padre_id !== undefined) {
    fieldsToUpdate.categoria_padre_id = categoria_padre_id ?? null;
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    const err = new Error('No hay campos válidos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  const ok = await repo.updateCategoria(id, empresaId, fieldsToUpdate);
  if (!ok) {
    const err = new Error('No se pudo actualizar la categoría');
    err.statusCode = 500;
    throw err;
  }

  return true;
}

async function remove(empresaId, id) {
  const categoria = await repo.findCategoriaById(id, empresaId);
  if (!categoria) {
    const err = new Error('Categoría no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const totalProductos = await repo.countProductosByCategoria(empresaId, id);
  if (totalProductos > 0) {
    const err = new Error('No se puede eliminar la categoría porque tiene productos asociados');
    err.statusCode = 400;
    throw err;
  }

  const deleted = await repo.deleteCategoria(id, empresaId);
  if (!deleted) {
    const err = new Error('No se pudo eliminar la categoría');
    err.statusCode = 500;
    throw err;
  }

  return true;
}

module.exports = {
  list,
  create,
  detail,
  update,
  remove
};
