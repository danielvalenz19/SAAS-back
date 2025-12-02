// src/modules/users/user.service.js
const repo = require('./user.repository');

async function getUserProfile(id) {
  return repo.findById(id);
}

module.exports = {
  getUserProfile
};
