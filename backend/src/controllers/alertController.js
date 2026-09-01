const alertService = require('../services/alert-service');

function sendError(res, error) {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : error.message
  });
}

async function getAlerts(req, res) {
  try {
    const result = await alertService.getAlerts(req.query);

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function getAlert(req, res) {
  try {
    const alert = await alertService.getAlertById(req.params.id);

    return res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function getActiveAlerts(req, res) {
  try {
    const result = await alertService.getAlerts({
      ...req.query,
      status: 'active'
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function getAlertStats(req, res) {
  try {
    const stats = await alertService.getAlertStatistics();

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function resolveAlert(req, res) {
  try {
    const alert = await alertService.resolveAlert(req.params.id);

    return res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function acknowledgeAlert(req, res) {
  try {
    const alert = await alertService.acknowledgeAlert(req.params.id);

    return res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  acknowledgeAlert,
  getActiveAlerts,
  getAlert,
  getAlertStats,
  getAlerts,
  resolveAlert
};
