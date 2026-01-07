/** @format */
// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getSystemStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getPendingContent,
  moderateVideo,
  bulkModerateVideos
} = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middlewares/AuthMiddleware');

// Dashboard & Analytics
router.get('/dashboard', isAuthenticated, isAdmin, getAdminDashboard);
router.get('/stats', isAuthenticated, isAdmin, getSystemStats);

// User Management
router.get('/users', isAuthenticated, isAdmin, getAllUsers);
router.put('/users/:userId', isAuthenticated, isAdmin, updateUser);
router.delete('/users/:userId', isAuthenticated, isAdmin, deleteUser);

// Content Moderation
router.get('/content/pending', isAuthenticated, isAdmin, getPendingContent);
router.put('/content/:videoId/moderate', isAuthenticated, isAdmin, moderateVideo);
router.post('/content/bulk-moderate', isAuthenticated, isAdmin, bulkModerateVideos);

module.exports = router;