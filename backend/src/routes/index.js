const express = require('express');
const deviceRoutes = require('./devices');

const router = express.Router();

router.use('/devices', deviceRoutes);

module.exports = router;
