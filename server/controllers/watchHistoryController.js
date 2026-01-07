/** @format */
// controllers/watchHistoryController.js
const { WatchHistory, Videos, Users, ContentCreators } = require("../models");
const { Op } = require("sequelize");

// Update watch progress
const updateWatchProgress = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { progressSeconds } = req.body;
    const userId = req.user.id;

    // Check if video exists
    const video = await Videos.findByPk(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    if (!progressSeconds || progressSeconds < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid progress seconds are required"
      });
    }

    // Calculate watch percentage
    const totalSeconds = video.duration;
    const watchPercentage = totalSeconds > 0 ? (progressSeconds / totalSeconds) * 100 : 0;
    const completed = watchPercentage >= 90; // Mark as completed if watched 90% or more

    // Find or create watch history record
    const [history, created] = await WatchHistory.findOrCreate({
      where: { userId, videoId },
      defaults: {
        progressSeconds,
        totalSeconds,
        watchPercentage,
        completed,
        watchedAt: new Date()
      }
    });

    if (!created) {
      // Update existing record
      await history.update({
        progressSeconds,
        totalSeconds,
        watchPercentage,
        completed,
        watchedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: "Watch progress updated successfully",
      data: {
        videoId: parseInt(videoId),
        progressSeconds,
        totalSeconds,
        watchPercentage: parseFloat(watchPercentage.toFixed(1)),
        completed,
        lastWatched: history.watchedAt
      }
    });

  } catch (error) {
    console.error("Update Watch Progress Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's continue watching list
const getContinueWatching = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is accessing their own history or is admin
    if (userId !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own watch history."
      });
    }

    const { count, rows: history } = await WatchHistory.findAndCountAll({
      where: { 
        userId,
        completed: false // Only show incomplete videos for "continue watching"
      },
      include: [
        {
          model: Videos,
          as: 'video',
          attributes: ['id', 'name', 'thumbnailUrl', 'duration', 'category'],
          include: [{
            model: ContentCreators,
            as: 'creator',
            attributes: ['id', 'name']
          }]
        }
      ],
      order: [['watchedAt', 'DESC']], // Show most recently watched first
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const continueWatching = history.map(item => ({
      id: item.id,
      progressSeconds: item.progressSeconds,
      totalSeconds: item.totalSeconds,
      watchPercentage: parseFloat(item.watchPercentage.toFixed(1)),
      watchedAt: item.watchedAt,
      video: item.video
    }));

    res.status(200).json({
      success: true,
      data: continueWatching,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalVideos: count
      }
    });

  } catch (error) {
    console.error("Get Continue Watching Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear watch history
const clearWatchHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedCount = await WatchHistory.destroy({
      where: { userId }
    });

    res.status(200).json({
      success: true,
      message: `Cleared ${deletedCount} videos from watch history`,
      data: { deletedCount }
    });

  } catch (error) {
    console.error("Clear Watch History Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get full watch history
const getWatchHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { page = 1, limit = 20, completed } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is accessing their own history or is admin
    if (userId !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own watch history."
      });
    }

    const whereClause = { userId };
    if (completed !== undefined) {
      whereClause.completed = completed === 'true';
    }

    const { count, rows: history } = await WatchHistory.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Videos,
          as: 'video',
          attributes: ['id', 'name', 'thumbnailUrl', 'duration', 'category'],
          include: [{
            model: ContentCreators,
            as: 'creator',
            attributes: ['id', 'name']
          }]
        }
      ],
      order: [['watchedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const watchHistory = history.map(item => ({
      id: item.id,
      progressSeconds: item.progressSeconds,
      totalSeconds: item.totalSeconds,
      watchPercentage: parseFloat(item.watchPercentage.toFixed(1)),
      completed: item.completed,
      watchedAt: item.watchedAt,
      video: item.video
    }));

    res.status(200).json({
      success: true,
      data: watchHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count
      }
    });

  } catch (error) {
    console.error("Get Watch History Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove specific video from watch history
const removeFromHistory = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    const deletedCount = await WatchHistory.destroy({
      where: { userId, videoId }
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Video not found in watch history"
      });
    }

    res.status(200).json({
      success: true,
      message: "Video removed from watch history",
      data: { videoId: parseInt(videoId) }
    });

  } catch (error) {
    console.error("Remove From History Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get watch statistics
const getWatchStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalWatched = await WatchHistory.count({ where: { userId } });
    const completedVideos = await WatchHistory.count({ 
      where: { userId, completed: true } 
    });
    const inProgressVideos = await WatchHistory.count({ 
      where: { userId, completed: false } 
    });

    // Total watch time in seconds
    const totalWatchTime = await WatchHistory.sum('progressSeconds', { 
      where: { userId } 
    }) || 0;

    // Watch history by category
    const historyByCategory = await WatchHistory.findAll({
      where: { userId },
      include: [{
        model: Videos,
        as: 'video',
        attributes: ['category']
      }]
    });

    const categoryStats = {};
    historyByCategory.forEach(item => {
      const category = item.video.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, totalTime: 0 };
      }
      categoryStats[category].count += 1;
      categoryStats[category].totalTime += item.progressSeconds;
    });

    // Recent activity
    const recentActivity = await WatchHistory.findAll({
      where: { userId },
      include: [{
        model: Videos,
        as: 'video',
        attributes: ['id', 'name', 'thumbnailUrl', 'category']
      }],
      order: [['watchedAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalWatched,
          completedVideos,
          inProgressVideos,
          totalWatchTime: Math.round(totalWatchTime / 60), // Convert to minutes
          completionRate: totalWatched > 0 ? (completedVideos / totalWatched) * 100 : 0
        },
        byCategory: categoryStats,
        recentActivity: recentActivity.map(item => ({
          videoId: item.video.id,
          videoName: item.video.name,
          category: item.video.category,
          progress: parseFloat(item.watchPercentage.toFixed(1)),
          watchedAt: item.watchedAt
        }))
      }
    });

  } catch (error) {
    console.error("Get Watch Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateWatchProgress,
  getContinueWatching,
  clearWatchHistory,
  getWatchHistory,
  removeFromHistory,
  getWatchStats
};