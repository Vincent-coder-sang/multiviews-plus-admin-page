// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const {
     createSubscription,
  getUserSubscription,
  cancelSubscription,
  getAllSubscriptions,
  checkSubscriptionStatus,
  getSubscriptionPlans,
  checkFeatureAccess,
  updateSubscription,
  checkExpiredSubscriptions
} = require('../controllers/subscriptionController');
const { isAuthenticated } = require('../middlewares/AuthMiddleware');

// Public routes
router.get('/plans', getSubscriptionPlans);

// User routes
router.post('/subscribe', isAuthenticated, createSubscription);
router.get('/user/:userId', isAuthenticated, getUserSubscription);
router.get('/user/:userId/status', isAuthenticated, checkSubscriptionStatus);
router.get('/user/:userId/feature/:feature', isAuthenticated, checkFeatureAccess);
router.put('/user/:userId/cancel', isAuthenticated, cancelSubscription);

// Admin routes
router.get('/admin/all', isAuthenticated, getAllSubscriptions);
router.put('/admin/:subscriptionId', isAuthenticated, updateSubscription);
router.post('/admin/check-expired', isAuthenticated, checkExpiredSubscriptions);

module.exports = router;