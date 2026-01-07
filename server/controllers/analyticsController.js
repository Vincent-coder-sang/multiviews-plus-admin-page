/** @format */
// controllers/analyticsController.js
const { 
  Videos, 
  VideoViews, 
  VideoLikes, 
  Users, 
  Subscriptions, 
  Payments, 
  ContentCreators,
  Downloads,
  Favorites
} = require("../models");
const { Op } = require("sequelize");

// Get analytics for content creators
const getCreatorAnalytics = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { period = 'month' } = req.query; // day, week, month, year

    // Verify creator exists
    const creator = await ContentCreators.findByPk(creatorId);
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Content creator not found"
      });
    }

    // Calculate date range
    const dateRange = calculateDateRange(period);
    
    // Get creator's videos
    const videos = await Videos.findAll({
      where: { creatorId },
      include: [
        {
          model: VideoViews,
          as: 'videoViews',
          where: {
            watchedAt: {
              [Op.between]: [dateRange.startDate, dateRange.endDate]
            }
          },
          required: false
        },
        {
          model: VideoLikes,
          as: 'videoLikes',
          required: false
        },
        {
          model: Downloads,
          as: 'downloads',
          required: false
        }
      ]
    });

    // Calculate analytics
    const totalViews = videos.reduce((sum, video) => sum + video.videoViews.length, 0);
    const totalLikes = videos.reduce((sum, video) => sum + video.videoLikes.length, 0);
    const totalDownloads = videos.reduce((sum, video) => sum + video.downloads.length, 0);
    
    // Calculate revenue (simplified - you'll need your actual revenue logic)
    const qualifiedViews = await VideoViews.count({
      include: [{
        model: Videos,
        as: 'video',
        where: { creatorId }
      }],
      where: {
        qualifiedView: true,
        watchedAt: {
          [Op.between]: [dateRange.startDate, dateRange.endDate]
        }
      }
    });

    const estimatedRevenue = qualifiedViews * 0.02 * creator.royaltyPercentage;

    // Top performing videos
    const topVideos = videos
      .map(video => ({
        id: video.id,
        name: video.name,
        views: video.videoViews.length,
        likes: video.videoLikes.length,
        downloads: video.downloads.length
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        creator: {
          id: creator.id,
          name: creator.name,
          email: creator.email
        },
        period: {
          type: period,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        overview: {
          totalVideos: videos.length,
          totalViews,
          totalLikes,
          totalDownloads,
          averageViewsPerVideo: videos.length > 0 ? totalViews / videos.length : 0,
          engagementRate: totalViews > 0 ? (totalLikes / totalViews) * 100 : 0
        },
        revenue: {
          qualifiedViews,
          estimatedRevenue: parseFloat(estimatedRevenue.toFixed(2)),
          royaltyRate: creator.royaltyPercentage
        },
        topVideos,
        growth: await calculateGrowthMetrics(creatorId, period)
      }
    });

  } catch (error) {
    console.error("Get Creator Analytics Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin dashboard analytics
const getAdminAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const dateRange = calculateDateRange(period);

    // Platform overview
    const totalUsers = await Users.count();
    const totalCreators = await ContentCreators.count();
    const totalVideos = await Videos.count();
    
    // Subscription analytics
    const activeSubscriptions = await Subscriptions.count({
      where: { 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    const subscriptionRevenue = await Payments.sum('amount', {
      where: { 
        status: 'successful',
        createdAt: { [Op.between]: [dateRange.startDate, dateRange.endDate] }
      }
    });

    // Content analytics
    const totalViews = await VideoViews.count({
      where: {
        watchedAt: { [Op.between]: [dateRange.startDate, dateRange.endDate] }
      }
    });

    const totalLikes = await VideoLikes.count({
      where: {
        likedAt: { [Op.between]: [dateRange.startDate, dateRange.endDate] }
      }
    });

    const totalDownloads = await Downloads.count({
      where: {
        downloadedAt: { [Op.between]: [dateRange.startDate, dateRange.endDate] }
      }
    });

    // User growth
    const newUsers = await Users.count({
      where: {
        createdAt: { [Op.between]: [dateRange.startDate, dateRange.endDate] }
      }
    });

    // Top creators
    const topCreators = await ContentCreators.findAll({
      include: [{
        model: Videos,
        as: 'videos',
        include: [{
          model: VideoViews,
          as: 'videoViews',
          where: {
            watchedAt: { [Op.between]: [dateRange.startDate, dateRange.endDate] }
          },
          required: false
        }]
      }],
      limit: 10
    });

    const topCreatorsData = topCreators.map(creator => ({
      id: creator.id,
      name: creator.name,
      videoCount: creator.videos.length,
      totalViews: creator.videos.reduce((sum, video) => sum + video.videoViews.length, 0),
      email: creator.email
    })).sort((a, b) => b.totalViews - a.totalViews);

    res.status(200).json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        platformOverview: {
          totalUsers,
          totalCreators,
          totalVideos,
          activeSubscriptions,
          newUsers
        },
        engagement: {
          totalViews,
          totalLikes,
          totalDownloads,
          averageWatchTime: await calculateAverageWatchTime(dateRange),
          popularCategories: await getPopularCategories(dateRange)
        },
        revenue: {
          subscriptionRevenue: subscriptionRevenue || 0,
          totalRevenue: subscriptionRevenue || 0, // Add other revenue sources if any
          revenueGrowth: await calculateRevenueGrowth(period)
        },
        topCreators: topCreatorsData,
        systemHealth: {
          uploadsThisPeriod: await Videos.count({
            where: {
              createdAt: { [Op.between]: [dateRange.startDate, dateRange.endDate] }
            }
          }),
          activeUsers: await getActiveUsersCount(dateRange)
        }
      }
    });

  } catch (error) {
    console.error("Get Admin Analytics Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Revenue reports for royalties
const getRevenueReports = async (req, res) => {
  try {
    const { creatorId, startDate, endDate } = req.query;

    const whereClause = {};
    if (creatorId) whereClause.creatorId = creatorId;
    
    if (startDate || endDate) {
      whereClause.watchedAt = {};
      if (startDate) whereClause.watchedAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.watchedAt[Op.lte] = new Date(endDate);
    }

    // Get qualified views for revenue calculation
    const qualifiedViews = await VideoViews.findAll({
      include: [{
        model: Videos,
        as: 'video',
        where: creatorId ? { creatorId } : {},
        include: [{
          model: ContentCreators,
          as: 'creator'
        }]
      }],
      where: {
        ...whereClause,
        qualifiedView: true
      }
    });

    // Calculate revenue by creator
    const revenueByCreator = {};
    qualifiedViews.forEach(view => {
      const creatorId = view.video.creator.id;
      const creatorName = view.video.creator.name;
      const revenue = view.revenueEarned || 0.02; // Default $0.02 per view

      if (!revenueByCreator[creatorId]) {
        revenueByCreator[creatorId] = {
          creatorId,
          creatorName,
          totalViews: 0,
          totalRevenue: 0,
          videos: {}
        };
      }

      revenueByCreator[creatorId].totalViews += 1;
      revenueByCreator[creatorId].totalRevenue += revenue;

      // Track by video
      const videoId = view.video.id;
      if (!revenueByCreator[creatorId].videos[videoId]) {
        revenueByCreator[creatorId].videos[videoId] = {
          videoId,
          videoName: view.video.name,
          views: 0,
          revenue: 0
        };
      }

      revenueByCreator[creatorId].videos[videoId].views += 1;
      revenueByCreator[creatorId].videos[videoId].revenue += revenue;
    });

    // Convert to array and calculate totals
    const revenueData = Object.values(revenueByCreator).map(creator => ({
      ...creator,
      videos: Object.values(creator.videos),
      totalRevenue: parseFloat(creator.totalRevenue.toFixed(2))
    }));

    const totalRevenue = revenueData.reduce((sum, creator) => sum + creator.totalRevenue, 0);
    const totalViews = revenueData.reduce((sum, creator) => sum + creator.totalViews, 0);

    res.status(200).json({
      success: true,
      data: {
        reportPeriod: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Present'
        },
        summary: {
          totalCreators: revenueData.length,
          totalQualifiedViews: totalViews,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          averagePerView: totalViews > 0 ? parseFloat((totalRevenue / totalViews).toFixed(4)) : 0
        },
        creatorBreakdown: revenueData.sort((a, b) => b.totalRevenue - a.totalRevenue),
        exportData: {
          availableFormats: ['JSON', 'CSV', 'PDF'],
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error("Get Revenue Reports Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper functions
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

const calculateGrowthMetrics = async (creatorId, period) => {
  const currentRange = calculateDateRange(period);
  const previousRange = calculateDateRange(period);
  
  // Move previous range back by the same period
  const periodMs = currentRange.endDate - currentRange.startDate;
  previousRange.startDate = new Date(previousRange.startDate - periodMs);
  previousRange.endDate = new Date(previousRange.endDate - periodMs);

  const currentViews = await VideoViews.count({
    include: [{
      model: Videos,
      as: 'video',
      where: { creatorId }
    }],
    where: {
      watchedAt: { [Op.between]: [currentRange.startDate, currentRange.endDate] }
    }
  });

  const previousViews = await VideoViews.count({
    include: [{
      model: Videos,
      as: 'video',
      where: { creatorId }
    }],
    where: {
      watchedAt: { [Op.between]: [previousRange.startDate, previousRange.endDate] }
    }
  });

  const viewsGrowth = previousViews > 0 ? ((currentViews - previousViews) / previousViews) * 100 : 100;

  return {
    viewsGrowth: parseFloat(viewsGrowth.toFixed(2)),
    currentPeriodViews: currentViews,
    previousPeriodViews: previousViews
  };
};

const calculateAverageWatchTime = async (dateRange) => {
  const result = await VideoViews.findOne({
    attributes: [
      [VideoViews.sequelize.fn('AVG', VideoViews.sequelize.col('watchDuration')), 'avgWatchTime']
    ],
    where: {
      watchedAt: { [Op.between]: [dateRange.startDate, dateRange.endDate] }
    }
  });

  return parseFloat((result?.dataValues.avgWatchTime || 0).toFixed(2));
};

const getPopularCategories = async (dateRange) => {
  const categories = await Videos.findAll({
    attributes: [
      'category',
      [Videos.sequelize.fn('COUNT', Videos.sequelize.col('id')), 'videoCount']
    ],
    include: [{
      model: VideoViews,
      as: 'videoViews',
      where: {
        watchedAt: { [Op.between]: [dateRange.startDate, dateRange.endDate] }
      },
      required: false
    }],
    group: ['category'],
    order: [[Videos.sequelize.literal('videoCount'), 'DESC']],
    limit: 5
  });

  return categories.map(cat => ({
    category: cat.category,
    videoCount: cat.dataValues.videoCount,
    popularity: cat.videoViews ? cat.videoViews.length : 0
  }));
};

const calculateRevenueGrowth = async (period) => {
  const currentRange = calculateDateRange(period);
  const previousRange = calculateDateRange(period);
  
  const periodMs = currentRange.endDate - currentRange.startDate;
  previousRange.startDate = new Date(previousRange.startDate - periodMs);
  previousRange.endDate = new Date(previousRange.endDate - periodMs);

  const currentRevenue = await Payments.sum('amount', {
    where: {
      status: 'successful',
      createdAt: { [Op.between]: [currentRange.startDate, currentRange.endDate] }
    }
  }) || 0;

  const previousRevenue = await Payments.sum('amount', {
    where: {
      status: 'successful',
      createdAt: { [Op.between]: [previousRange.startDate, previousRange.endDate] }
    }
  }) || 0;

  const growth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 100;

  return parseFloat(growth.toFixed(2));
};

const getActiveUsersCount = async (dateRange) => {
  return await Users.count({
    include: [{
      model: VideoViews,
      as: 'videoViews',
      where: {
        watchedAt: { [Op.between]: [dateRange.startDate, dateRange.endDate] }
      },
      required: true
    }],
    distinct: true
  });
};

module.exports = {
  getCreatorAnalytics,
  getAdminAnalytics,
  getRevenueReports
};