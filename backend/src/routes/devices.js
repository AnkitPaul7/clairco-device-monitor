const express = require('express');
const deviceController = require('../controllers/deviceController');
const {
  validateCreateDevice,
  validateDeviceIdentifier,
  validateUpdateDevice
} = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, deviceController.getDevices);
router.get('/:id', authenticate, validateDeviceIdentifier, deviceController.getDevice);
router.post('/', authenticate, validateCreateDevice, deviceController.createDevice);
router.put(
  '/:id',
  authenticate,
  validateDeviceIdentifier,
  validateUpdateDevice,
  deviceController.updateDevice
);
router.delete('/:id', authenticate, validateDeviceIdentifier, deviceController.deleteDevice);

module.exports = router;
