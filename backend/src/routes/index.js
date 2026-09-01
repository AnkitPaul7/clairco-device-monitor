const express = require('express');
const alertRoutes = require('./alerts');
const deviceRoutes = require('./devices');

const router = express.Router();

router.use('/alerts', alertRoutes);
router.use('/devices', deviceRoutes);

module.exports = router;
