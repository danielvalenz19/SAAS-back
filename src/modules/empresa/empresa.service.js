// src/modules/empresa/empresa.service.js
const repo = require('./empresa.repository');

async function getEmpresa(empresaId) {
  const empresa = await repo.getEmpresaById(empresaId);
  if (!empresa) {
    const err = new Error('Empresa no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return empresa;
}

async function updateEmpresa(empresaId, data) {
  const allowed = ['nombre', 'nit', 'telefono', 'email', 'direccion', 'plan', 'estado'];

  const updateData = Object.keys(data || {})
    .filter((k) => allowed.includes(k))
    .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {});

  if (Object.keys(updateData).length === 0) {
    const err = new Error('No hay campos válidos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  const updated = await repo.updateEmpresa(empresaId, updateData);
  if (!updated) {
    const err = new Error('Empresa no encontrada');
    err.statusCode = 404;
    throw err;
  }

  return true;
}

module.exports = {
  getEmpresa,
  updateEmpresa
};
