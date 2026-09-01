const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, alertController.getAlerts);
router.get('/active', authenticate, alertController.getActiveAlerts);
router.get('/stats', authenticate, alertController.getAlertStats);
router.get('/:id', authenticate, alertController.getAlert);
router.post('/:id/resolve', authenticate, alertController.resolveAlert);
router.post('/:id/acknowledge', authenticate, alertController.acknowledgeAlert);

module.exports = router;
