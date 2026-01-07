/** @format */
// controllers/favoritesController.js
const { Favorites, Videos, Users, ContentCreators, VideoLikes } = require("../models");
const { Op } = require("sequelize");

// Add video to favorites
const addToFavorites = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    // Check if video exists
    const video = await Videos.findByPk(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    // Check if already in favorites
    const existingFavorite = await Favorites.findOne({
      where: { userId, videoId }
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: "Video is already in your favorites"
      });
    }

    // Add to favorites
    const favorite = await Favorites.create({
      userId,
      videoId
    });

    // Get the favorite with video details
    const favoriteWithDetails = await Favorites.findByPk(favorite.id, {
      include: [{
        model: Videos,
        as: 'video',
        attributes: ['id', 'name', 'thumbnailUrl', 'duration', 'category'],
        include: [{
          model: ContentCreators,
          as: 'creator',
          attributes: ['id', 'name']
        }]
      }]
    });

    res.status(201).json({
      success: true,
      message: "Video added to favorites successfully",
      data: favoriteWithDetails
    });

  } catch (error) {
    console.error("Add to Favorites Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's favorite videos
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { page = 1, limit = 20, category } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is accessing their own favorites or is admin
    if (userId !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own favorites."
      });
    }

    const whereClause = { userId };
    
    // Include video filter in the join
    const videoWhereClause = {};
    if (category) videoWhereClause.category = category;

    const { count, rows: favorites } = await Favorites.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Videos,
          as: 'video',
          where: videoWhereClause,
          attributes: [
            'id', 'name', 'desc', 'thumbnailUrl', 'videoUrl', 
            'duration', 'category', 'createdAt'
          ],
          include: [
            {
              model: ContentCreators,
              as: 'creator',
              attributes: ['id', 'name', 'email']
            },
            {
              model: VideoLikes,
              as: 'videoLikes',
              attributes: ['id'],
              required: false
            }
          ]
        },
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Enhance favorites with additional data
    const favoritesWithStats = await Promise.all(
      favorites.map(async (favorite) => {
        const video = favorite.video;
        
        // Get view count
        const viewCount = await require('../models').VideoViews.count({
          where: { videoId: video.id }
        });

        // Check if user has liked this video
        const userLike = await VideoLikes.findOne({
          where: { userId, videoId: video.id }
        });

        return {
          id: favorite.id,
          addedAt: favorite.createdAt,
          video: {
            ...video.toJSON(),
            viewsCount: viewCount,
            likesCount: video.videoLikes.length,
            isLiked: !!userLike
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: favoritesWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalFavorites: count,
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Get User Favorites Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorites.findOne({
      where: { userId, videoId },
      include: [{
        model: Videos,
        as: 'video',
        attributes: ['id', 'name']
      }]
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Video not found in your favorites"
      });
    }

    await favorite.destroy();

    res.status(200).json({
      success: true,
      message: "Video removed from favorites successfully",
      data: {
        removedVideo: {
          id: favorite.video.id,
          name: favorite.video.name
        }
      }
    });

  } catch (error) {
    console.error("Remove from Favorites Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check if video is in favorites
const checkIsFavorite = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorites.findOne({
      where: { userId, videoId }
    });

    res.status(200).json({
      success: true,
      data: {
        isFavorite: !!favorite,
        videoId: parseInt(videoId)
      }
    });

  } catch (error) {
    console.error("Check Favorite Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear all favorites
const clearAllFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedCount = await Favorites.destroy({
      where: { userId }
    });

    res.status(200).json({
      success: true,
      message: `Cleared ${deletedCount} videos from favorites`,
      data: { deletedCount }
    });

  } catch (error) {
    console.error("Clear All Favorites Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get favorite statistics
const getFavoriteStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalFavorites = await Favorites.count({ where: { userId } });
    
    // Get favorites by category
    const favoritesByCategory = await Favorites.findAll({
      where: { userId },
      include: [{
        model: Videos,
        as: 'video',
        attributes: ['category']
      }]
    });

    const categoryCount = {};
    favoritesByCategory.forEach(fav => {
      const category = fav.video.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    // Recent favorites
    const recentFavorites = await Favorites.findAll({
      where: { userId },
      include: [{
        model: Videos,
        as: 'video',
        attributes: ['id', 'name', 'thumbnailUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        totalFavorites,
        byCategory: categoryCount,
        recentAdditions: recentFavorites.map(fav => ({
          id: fav.video.id,
          name: fav.video.name,
          thumbnailUrl: fav.video.thumbnailUrl,
          addedAt: fav.createdAt
        }))
      }
    });

  } catch (error) {
    console.error("Get Favorite Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle favorite (add/remove in one endpoint)
const toggleFavorite = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    // Check if video exists
    const video = await Videos.findByPk(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    const existingFavorite = await Favorites.findOne({
      where: { userId, videoId }
    });

    if (existingFavorite) {
      // Remove from favorites
      await existingFavorite.destroy();
      
      return res.status(200).json({
        success: true,
        message: "Video removed from favorites",
        data: {
          isFavorite: false,
          action: 'removed'
        }
      });
    } else {
      // Add to favorites
      await Favorites.create({ userId, videoId });
      
      return res.status(200).json({
        success: true,
        message: "Video added to favorites",
        data: {
          isFavorite: true,
          action: 'added'
        }
      });
    }

  } catch (error) {
    console.error("Toggle Favorite Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addToFavorites,
  getUserFavorites,
  removeFromFavorites,
  checkIsFavorite,
  clearAllFavorites,
  getFavoriteStats,
  toggleFavorite
};