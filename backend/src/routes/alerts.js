const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');
const { validateAlertIdentifier } = require('../middleware/validation');

const router = express.Router();

router.get('/', authenticate, alertController.getAlerts);
router.get('/active', authenticate, alertController.getActiveAlerts);
router.get('/stats', authenticate, alertController.getAlertStats);
router.get('/:id', authenticate, validateAlertIdentifier, alertController.getAlert);
router.post('/:id/resolve', authenticate, validateAlertIdentifier, alertController.resolveAlert);
router.post(
  '/:id/acknowledge',
  authenticate,
  validateAlertIdentifier,
  alertController.acknowledgeAlert
);

module.exports = router;
