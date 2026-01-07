// routes/analyticsRoutes.js
const express = require('express');
const { isAuthenticated, isAdmin } = require('../middlewares/AuthMiddleware');
const { getCreatorAnalytics, getAdminAnalytics, getRevenueReports } = require('../controllers/analyticsController');
const router = express.Router();

// Creator analytics (creator can only access their own)
router.get('/creator/:creatorId', isAuthenticated, getCreatorAnalytics);

// Admin analytics (admin only)
router.get('/admin/overview', isAuthenticated, isAdmin, getAdminAnalytics);

// Revenue reports (admin only)
router.get('/admin/revenue-reports', isAuthenticated, isAdmin, getRevenueReports);

module.exports = router;