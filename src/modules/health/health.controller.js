// src/modules/health/health.controller.js
const healthService = require('./health.service');

async function getHealth(req, res, next) {
  try {
    const data = await healthService.checkAppStatus();
    res.json({
      ok: true,
      ...data
    });
  } catch (err) {
    next(err);
  }
}

async function getHealthDB(req, res, next) {
  try {
    const appStatus = await healthService.checkAppStatus();
    const dbStatus = await healthService.checkDBStatus();

    res.json({
      ok: true,
      app: appStatus.status,
      db: dbStatus.status,
      timestamp: appStatus.timestamp
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHealth,
  getHealthDB
};
