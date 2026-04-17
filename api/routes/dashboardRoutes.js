const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

router.get('/', auth, checkPermission('reports.view'), dashboardController.getMetrics);

module.exports = router;
