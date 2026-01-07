// routes/videoViewsRoutes.js
const express = require('express');
const router = express.Router();
const {
  trackView,
  updateViewProgress,
  getVideoViews,
  getPopularVideos,
  getCreatorViewAnalytics,
  getUserWatchHistory
} = require('../controllers/videoViewsController');
const { isAuthenticated, isAdmin } = require('../middlewares/AuthMiddleware');

// Public routes
router.get('/popular', getPopularVideos);
router.get('/video/:videoId/views', getVideoViews);

// User routes (allow anonymous for tracking)
router.post('/track/:videoId', trackView);
router.put('/progress/:viewId', updateViewProgress);
router.get('/my-history', isAuthenticated, getUserWatchHistory);

// Creator routes
router.get('/creator/:creatorId/analytics', isAuthenticated, getCreatorViewAnalytics);

// Admin routes
router.get('/admin/user/:userId/history', isAuthenticated, isAdmin, getUserWatchHistory);

module.exports = router;