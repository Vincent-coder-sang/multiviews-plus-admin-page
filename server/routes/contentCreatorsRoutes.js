// routes/contentCreatorsRoutes.js
const express = require('express');
const { getCreatorVideos, createCreator, updateCreator, deleteCreator, getCreators, searchCreators, getCreatorById } = require('../controllers/contentCreatorsController');
const { isAuthenticated, isAdmin } = require('../middlewares/AuthMiddleware');
const router = express.Router();

// Public routes
router.get('/get', getCreators);
router.get('/search', searchCreators);
router.get('/get/:creatorId', getCreatorById);
router.get('/get/:creatorId/videos', getCreatorVideos);

// Admin routes
router.post('/create', isAuthenticated, isAdmin, createCreator);
router.put('/update/:creatorId', isAuthenticated, isAdmin, updateCreator);
router.delete('/delete/:creatorId', isAuthenticated, isAdmin, deleteCreator);

module.exports = router;