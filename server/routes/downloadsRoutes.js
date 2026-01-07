// routes/downloadsRoutes.js
const express = require('express');
const router = express.Router();
const {
  downloadVideo,
  getUserDownloads,
  deleteDownload,
  getDownloadStats,
  clearExpiredDownloads
} = require('../controllers/downloadsController');
const { isAuthenticated, isAdmin } = require('../middlewares/AuthMiddleware');

// User routes
router.post('/download/:videoId', isAuthenticated, downloadVideo);
router.get('/my-downloads', isAuthenticated, getUserDownloads);
router.get('/stats', isAuthenticated, getDownloadStats);
router.delete('/delete/:downloadId', isAuthenticated, deleteDownload);

// Admin routes
router.get('/admin/user/:userId/downloads', isAuthenticated, isAdmin, getUserDownloads);
router.post('/admin/clear-expired', isAuthenticated, isAdmin, clearExpiredDownloads);

module.exports = router;