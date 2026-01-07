/** @format */
// controllers/videoViewsController.js
const { VideoViews, Videos, Users, ContentCreators } = require("../models");
const { Op } = require("sequelize");

// Track video view
const trackView = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.id || null; // Allow anonymous views
    const { watchDuration, totalDuration, quality, deviceInfo } = req.body;

    // Check if video exists
    const video = await Videos.findByPk(videoId, {
      include: [{
        model: ContentCreators,
        as: 'creator',
        attributes: ['id']
      }]
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    // Calculate watch percentage
    const watchPercentage = totalDuration > 0 ? (watchDuration / totalDuration) * 100 : 0;

    // Determine if this is a qualified view (for royalty payments)
    const MIN_WATCH_PERCENTAGE = 50; // 50% minimum
    const MIN_WATCH_SECONDS = 300; // 5 minutes minimum
    const qualifiedView = watchPercentage >= MIN_WATCH_PERCENTAGE || watchDuration >= MIN_WATCH_SECONDS;

    // Calculate revenue for qualified views
    const revenueEarned = qualifiedView ? 0.02 : 0; // $0.02 per qualified view

    // Create view record
    const view = await VideoViews.create({
      userId,
      videoId,
      ownerId: video.creator.id,
      watchDuration: watchDuration || 0,
      totalDuration: totalDuration || video.duration,
      watchPercentage,
      quality: quality || 'auto',
      deviceInfo: deviceInfo || {},
      ipAddress: req.ip,
      qualifiedView,
      revenueEarned,
      viewStartedAt: new Date(),
      viewEndedAt: new Date()
    });

    // Update video's total views count (you might want to cache this)
    await Videos.increment('viewCount', { where: { id: videoId } });

    res.status(201).json({
      success: true,
      message: "View tracked successfully",
      data: {
        viewId: view.id,
        qualifiedView,
        watchPercentage: parseFloat(watchPercentage.toFixed(2)),
        revenueEarned
      }
    });

  } catch (error) {
    console.error("Track View Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update view progress
const updateViewProgress = async (req, res) => {
  try {
    const { viewId } = req.params;
    const { watchDuration, totalDuration } = req.body;

    const view = await VideoViews.findByPk(viewId);
    if (!view) {
      return res.status(404).json({
        success: false,
        message: "View record not found"
      });
    }

    // Recalculate watch percentage and qualification
    const watchPercentage = totalDuration > 0 ? (watchDuration / totalDuration) * 100 : 0;
    const MIN_WATCH_PERCENTAGE = 50;
    const MIN_WATCH_SECONDS = 300;
    const qualifiedView = watchPercentage >= MIN_WATCH_PERCENTAGE || watchDuration >= MIN_WATCH_SECONDS;
    const revenueEarned = qualifiedView ? 0.02 : 0;

    await view.update({
      watchDuration,
      totalDuration,
      watchPercentage,
      qualifiedView,
      revenueEarned,
      viewEndedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "View progress updated",
      data: {
        qualifiedView,
        watchPercentage: parseFloat(watchPercentage.toFixed(2))
      }
    });

  } catch (error) {
    console.error("Update View Progress Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get view count for video
const getVideoViews = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { period = 'all' } = req.query; // day, week, month, year, all

    // Check if video exists
    const video = await Videos.findByPk(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    const dateRange = calculateDateRange(period);
    const whereClause = { videoId };

    if (period !== 'all') {
      whereClause.viewStartedAt = {
        [Op.between]: [dateRange.startDate, dateRange.endDate]
      };
    }

    const totalViews = await VideoViews.count({ where: whereClause });
    const qualifiedViews = await VideoViews.count({ 
      where: { ...whereClause, qualifiedView: true } 
    });

    // Average watch time
    const avgWatchResult = await VideoViews.findOne({
      attributes: [
        [VideoViews.sequelize.fn('AVG', VideoViews.sequelize.col('watchDuration')), 'avgWatchTime'],
        [VideoViews.sequelize.fn('AVG', VideoViews.sequelize.col('watchPercentage')), 'avgWatchPercentage']
      ],
      where: whereClause
    });

    // Viewer demographics (simplified)
    const uniqueViewers = await VideoViews.count({
      where: whereClause,
      distinct: true,
      col: 'userId'
    });

    const estimatedRevenue = qualifiedViews * 0.02;

    res.status(200).json({
      success: true,
      data: {
        video: {
          id: video.id,
          name: video.name,
          duration: video.duration
        },
        period: {
          type: period,
          startDate: period !== 'all' ? dateRange.startDate : null,
          endDate: period !== 'all' ? dateRange.endDate : null
        },
        views: {
          total: totalViews,
          qualified: qualifiedViews,
          uniqueViewers,
          qualificationRate: totalViews > 0 ? (qualifiedViews / totalViews) * 100 : 0
        },
        engagement: {
          avgWatchTime: parseFloat((avgWatchResult?.dataValues.avgWatchTime || 0).toFixed(2)),
          avgWatchPercentage: parseFloat((avgWatchResult?.dataValues.avgWatchPercentage || 0).toFixed(2))
        },
        revenue: {
          estimated: parseFloat(estimatedRevenue.toFixed(2)),
          ratePerView: 0.02
        }
      }
    });

  } catch (error) {
    console.error("Get Video Views Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get most viewed videos
const getPopularVideos = async (req, res) => {
  try {
    const { period = 'month', limit = 20, category } = req.query;
    const dateRange = calculateDateRange(period);

    const whereClause = {
      viewStartedAt: {
        [Op.between]: [dateRange.startDate, dateRange.endDate]
      }
    };

    // Get popular videos based on view count
    const popularVideos = await VideoViews.findAll({
      attributes: [
        'videoId',
        [VideoViews.sequelize.fn('COUNT', VideoViews.sequelize.col('id')), 'viewCount'],
        [VideoViews.sequelize.fn('SUM', VideoViews.sequelize.col('revenueEarned')), 'totalRevenue'],
        [VideoViews.sequelize.fn('AVG', VideoViews.sequelize.col('watchPercentage')), 'avgEngagement']
      ],
      where: whereClause,
      include: [{
        model: Videos,
        as: 'video',
        attributes: ['id', 'name', 'thumbnailUrl', 'duration', 'category', 'createdAt'],
        where: category ? { category } : {},
        include: [{
          model: ContentCreators,
          as: 'creator',
          attributes: ['id', 'name']
        }]
      }],
      group: ['videoId', 'video.id'],
      order: [[VideoViews.sequelize.literal('viewCount'), 'DESC']],
      limit: parseInt(limit)
    });

    const formattedVideos = popularVideos.map(item => ({
      video: {
        ...item.video.toJSON(),
        creator: item.video.creator
      },
      stats: {
        viewCount: parseInt(item.dataValues.viewCount),
        totalRevenue: parseFloat(item.dataValues.totalRevenue || 0),
        avgEngagement: parseFloat((item.dataValues.avgEngagement || 0).toFixed(2))
      },
      rank: popularVideos.indexOf(item) + 1
    }));

    res.status(200).json({
      success: true,
      data: formattedVideos,
      period: {
        type: period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
    });

  } catch (error) {
    console.error("Get Popular Videos Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get viewer analytics for creator
const getCreatorViewAnalytics = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { period = 'month' } = req.query;

    const dateRange = calculateDateRange(period);

    // Verify creator exists
    const creator = await ContentCreators.findByPk(creatorId);
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Content creator not found"
      });
    }

    // Get total views and revenue
    const viewsData = await VideoViews.findAll({
      attributes: [
        [VideoViews.sequelize.fn('COUNT', VideoViews.sequelize.col('id')), 'totalViews'],
        [VideoViews.sequelize.fn('SUM', VideoViews.sequelize.col('revenueEarned')), 'totalRevenue'],
        [VideoViews.sequelize.fn('COUNT', VideoViews.sequelize.col('id')), 'qualifiedViews']
      ],
      include: [{
        model: Videos,
        as: 'video',
        where: { creatorId },
        attributes: []
      }],
      where: {
        viewStartedAt: {
          [Op.between]: [dateRange.startDate, dateRange.endDate]
        }
      },
      raw: true
    });

    // Get views by video
    const viewsByVideo = await VideoViews.findAll({
      attributes: [
        'videoId',
        [VideoViews.sequelize.fn('COUNT', VideoViews.sequelize.col('id')), 'viewCount']
      ],
      include: [{
        model: Videos,
        as: 'video',
        where: { creatorId },
        attributes: ['id', 'name']
      }],
      where: {
        viewStartedAt: {
          [Op.between]: [dateRange.startDate, dateRange.endDate]
        }
      },
      group: ['videoId', 'video.id'],
      order: [[VideoViews.sequelize.literal('viewCount'), 'DESC']],
      limit: 10
    });

    // Get daily views trend
    const dailyTrend = await VideoViews.findAll({
      attributes: [
        [VideoViews.sequelize.fn('DATE', VideoViews.sequelize.col('viewStartedAt')), 'date'],
        [VideoViews.sequelize.fn('COUNT', VideoViews.sequelize.col('id')), 'views']
      ],
      include: [{
        model: Videos,
        as: 'video',
        where: { creatorId },
        attributes: []
      }],
      where: {
        viewStartedAt: {
          [Op.between]: [dateRange.startDate, dateRange.endDate]
        }
      },
      group: [VideoViews.sequelize.fn('DATE', VideoViews.sequelize.col('viewStartedAt'))],
      order: [[VideoViews.sequelize.fn('DATE', VideoViews.sequelize.col('viewStartedAt')), 'ASC']]
    });

    const data = viewsData[0] || {};
    const totalRevenue = parseFloat(data.totalRevenue || 0);
    const creatorRevenue = totalRevenue * creator.royaltyPercentage;

    res.status(200).json({
      success: true,
      data: {
        creator: {
          id: creator.id,
          name: creator.name,
          royaltyRate: creator.royaltyPercentage
        },
        period: {
          type: period,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        overview: {
          totalViews: parseInt(data.totalViews || 0),
          qualifiedViews: parseInt(data.qualifiedViews || 0),
          qualificationRate: data.totalViews > 0 ? (data.qualifiedViews / data.totalViews) * 100 : 0,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          creatorRevenue: parseFloat(creatorRevenue.toFixed(2))
        },
        topVideos: viewsByVideo.map(item => ({
          videoId: item.videoId,
          videoName: item.video.name,
          viewCount: parseInt(item.dataValues.viewCount)
        })),
        dailyTrend: dailyTrend.map(item => ({
          date: item.dataValues.date,
          views: parseInt(item.dataValues.views)
        }))
      }
    });

  } catch (error) {
    console.error("Get Creator View Analytics Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to calculate date ranges
const calculateDateRange = (period) => {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return { startDate, endDate: now };
};

// Get user's watch history
const getUserWatchHistory = async (req, res) => {
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

    const { count, rows: views } = await VideoViews.findAndCountAll({
      where: { userId },
      include: [{
        model: Videos,
        as: 'video',
        attributes: ['id', 'name', 'thumbnailUrl', 'duration', 'category'],
        include: [{
          model: ContentCreators,
          as: 'creator',
          attributes: ['id', 'name']
        }]
      }],
      order: [['viewStartedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const watchHistory = views.map(view => ({
      id: view.id,
      video: view.video,
      watchDuration: view.watchDuration,
      totalDuration: view.totalDuration,
      watchPercentage: parseFloat(view.watchPercentage.toFixed(1)),
      qualifiedView: view.qualifiedView,
      viewedAt: view.viewStartedAt
    }));

    res.status(200).json({
      success: true,
      data: watchHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalViews: count,
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Get User Watch History Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  trackView,
  updateViewProgress,
  getVideoViews,
  getPopularVideos,
  getCreatorViewAnalytics,
  getUserWatchHistory
};