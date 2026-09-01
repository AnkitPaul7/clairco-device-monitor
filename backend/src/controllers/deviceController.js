const deviceService = require('../services/device-service');

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: statusCode === 500 ? 'Internal server error' : error.message
  };

  if (error.details) {
    payload.errors = error.details;
  }

  return res.status(statusCode).json(payload);
}

async function getDevices(req, res) {
  try {
    const devices = await deviceService.getAllDevices({
      includeInactive: req.query.includeInactive === 'true'
    });

    return res.status(200).json({
      success: true,
      data: devices
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function getDevice(req, res) {
  try {
    const device = await deviceService.getDeviceById(req.params.id);

    return res.status(200).json({
      success: true,
      data: device
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function createDevice(req, res) {
  try {
    const device = await deviceService.createDevice(req.body);

    return res.status(201).json({
      success: true,
      data: device
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function updateDevice(req, res) {
  try {
    const device = await deviceService.updateDevice(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      data: device
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function deleteDevice(req, res) {
  try {
    const device = await deviceService.deleteDevice(req.params.id);

    return res.status(200).json({
      success: true,
      data: device
    });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  createDevice,
  deleteDevice,
  getDevice,
  getDevices,
  updateDevice
};
