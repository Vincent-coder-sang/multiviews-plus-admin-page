// routes/watchHistoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  updateWatchProgress,
  getContinueWatching,
  clearWatchHistory,
  getWatchHistory,
  removeFromHistory,
  getWatchStats
} = require('../controllers/watchHistoryController');
const { isAuthenticated, isAdmin } = require('../middlewares/AuthMiddleware');

// User routes
router.put('/progress/:videoId', isAuthenticated, updateWatchProgress);
router.get('/continue-watching', isAuthenticated, getContinueWatching);
router.get('/history', isAuthenticated, getWatchHistory);
router.get('/stats', isAuthenticated, getWatchStats);
router.delete('/clear', isAuthenticated, clearWatchHistory);
router.delete('/remove/:videoId', isAuthenticated, removeFromHistory);

// Admin routes
router.get('/admin/user/:userId/history', isAuthenticated, isAdmin, getWatchHistory);

module.exports = router;