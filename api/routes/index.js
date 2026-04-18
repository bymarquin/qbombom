const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const additionalRoutes = require('./additionalRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const customerRoutes = require('./customerRoutes');
const settingRoutes = require('./settingRoutes');
const userRoutes = require('./userRoutes');
const mailerRoutes = require('./mailerRoutes');
const whatsappRoutes = require('./whatsappRoutes');
const importRoutes = require('./importRoutes');
const geocodeRoutes = require('./geocodeRoutes');

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/additionals', additionalRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/customers', customerRoutes);
router.use('/settings', settingRoutes);
router.use('/users', userRoutes);
router.use('/mailer', mailerRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/import', importRoutes);
router.use('/geocode', geocodeRoutes);

module.exports = router;
