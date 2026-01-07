// routes/favoritesRoutes.js
const express = require('express');
const router = express.Router();
const {
  addToFavorites,
  getUserFavorites,
  removeFromFavorites,
  checkIsFavorite,
  clearAllFavorites,
  getFavoriteStats,
  toggleFavorite
} = require('../controllers/favoritesController');
const { isAuthenticated, isAdmin } = require('../middlewares/AuthMiddleware');

// User routes
router.post('/add/:videoId', isAuthenticated, addToFavorites);
router.get('/my-favorites', isAuthenticated, getUserFavorites);
router.get('/check/:videoId', isAuthenticated, checkIsFavorite);
router.get('/stats', isAuthenticated, getFavoriteStats);
router.delete('/remove/:videoId', isAuthenticated, removeFromFavorites);
router.delete('/clear-all', isAuthenticated, clearAllFavorites);
router.post('/toggle/:videoId', isAuthenticated, toggleFavorite);

// Admin routes
router.get('/admin/user/:userId/favorites', isAuthenticated, isAdmin, getUserFavorites);

module.exports = router;