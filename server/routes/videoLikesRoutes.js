// routes/videoLikesRoutes.js
const express = require('express');
const router = express.Router();
const {
  likeVideo,
  getVideoLikes,
  getUserLikedVideos
} = require('../controllers/videoLikesController');
const { isAuthenticated, isAdmin } = require('../middlewares/AuthMiddleware');

// Public routes
router.get('/video/:videoId', getVideoLikes);

// User routes
router.post('/like/:videoId', isAuthenticated, likeVideo);
router.get('/my-likes', isAuthenticated, getUserLikedVideos);

// Admin routes
router.get('/user/:userId/likes', isAuthenticated, isAdmin, getUserLikedVideos);

module.exports = router;