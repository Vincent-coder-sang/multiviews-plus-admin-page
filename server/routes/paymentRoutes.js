/** @format */
// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const {
	createPayment,
	  getPaymentById,
	  getUserPayments,
	  getAllPayments,
	  updatePaymentStatus,
	  processRefund,
	  getPaymentStatistics,
	  handlePaymentWebhook,
} = require('../controllers/paymentController');
const { isAuthenticated, isClient, isPremium, isAdmin } = require('../middlewares/AuthMiddleware');


// User routes - any authenticated user
router.post('/create', isAuthenticated, createPayment);
router.get('/get/user/my-payments', isAuthenticated, getUserPayments);
router.get('/get/:paymentId', isAuthenticated, getPaymentById);

// Client-specific routes
router.get('/get/user/:userId/history', isAuthenticated, isClient, getUserPayments);

// Premium user routes (if needed for premium features)
router.get('/get/premium/benefits', isAuthenticated, isPremium, (req, res) => {
  res.json({ message: 'Premium payment benefits' });
});

// Admin routes
router.get('/admin/all', isAuthenticated, isAdmin, getAllPayments);
router.put('/admin/:paymentId/status', isAuthenticated, isAdmin, updatePaymentStatus);
router.post('/admin/:paymentId/refund', isAuthenticated, isAdmin, processRefund);
router.get('/admin/statistics', isAuthenticated, isAdmin, getPaymentStatistics);

// Webhook routes (no auth - called by payment providers)
router.post('/webhook/:provider', handlePaymentWebhook);

// Public routes (if any)
router.get('/plans/public', (req, res) => {
  // Return basic payment plan info without auth
  res.json({ message: 'Public payment plans' });
});

module.exports = router;