/** @format */
// controllers/adminController.js
const { 
  Users, Videos, ContentCreators, Subscriptions, Payments, 
  VideoViews, VideoLikes, Downloads, WatchHistory, Favorites 
} = require("../models");
const { Op } = require("sequelize");

// Get admin dashboard overview
const getAdminDashboard = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const dateRange = calculateDateRange(period);

    // Platform statistics
    const totalUsers = await Users.count();
    const totalCreators = await ContentCreators.count();
    const totalVideos = await Videos.count();
    const activeSubscriptions = await Subscriptions.count({
      where: { 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    // Revenue statistics
    const totalRevenue = await Payments.sum('amount', {
      where: { 
        status: 'successful',
        createdAt: { [Op.gte]: dateRange.startDate }
      }
    });

    // Content moderation stats
    const pendingVideos = await Videos.count({ where: { status: 'pending' } });
    const approvedVideos = await Videos.count({ where: { status: 'approved' } });
    const rejectedVideos = await Videos.count({ where: { status: 'rejected' } });

    // Engagement statistics
    const totalViews = await VideoViews.count({
      where: {
        watchedAt: { [Op.gte]: dateRange.startDate }
      }
    });

    const totalLikes = await VideoLikes.count({
      where: {
        likedAt: { [Op.gte]: dateRange.startDate }
      }
    });

    // User statistics
    const activeUsers = await Users.count({ where: { isActive: true } });
    const inactiveUsers = await Users.count({ where: { isActive: false } });
    const premiumUsers = await Users.count({ where: { userType: 'premium' } });

    // Recent activities
    const recentUsers = await Users.findAll({
      attributes: ['id', 'name', 'email', 'userType', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const recentVideos = await Videos.findAll({
      include: [{
        model: ContentCreators,
        as: 'creator',
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        overview: {
          totalUsers,
          totalCreators,
          totalVideos,
          activeSubscriptions,
          activeUsers,
          inactiveUsers,
          premiumUsers
        },
        revenue: {
          total: totalRevenue || 0,
          currency: 'NGN'
        },
        content: {
          pending: pendingVideos,
          approved: approvedVideos,
          rejected: rejectedVideos,
          approvalRate: totalVideos > 0 ? (approvedVideos / totalVideos) * 100 : 0
        },
        engagement: {
          totalViews,
          totalLikes,
          avgWatchTime: await calculateAverageWatchTime(dateRange)
        },
        recentActivities: {
          users: recentUsers,
          videos: recentVideos
        }
      }
    });

  } catch (error) {
    console.error("Get Admin Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    // User statistics
    const userStats = await Users.findAll({
      attributes: [
        'userType',
        [Users.sequelize.fn('COUNT', Users.sequelize.col('id')), 'count']
      ],
      group: ['userType']
    });

    // Video statistics by category and status
    const videoStats = await Videos.findAll({
      attributes: [
        'category',
        'status',
        [Videos.sequelize.fn('COUNT', Videos.sequelize.col('id')), 'count']
      ],
      group: ['category', 'status'],
      order: [[Videos.sequelize.literal('count'), 'DESC']]
    });

    // Subscription statistics
    const subscriptionStats = await Subscriptions.findAll({
      attributes: [
        'planType',
        'status',
        [Subscriptions.sequelize.fn('COUNT', Subscriptions.sequelize.col('id')), 'count']
      ],
      group: ['planType', 'status']
    });

    res.status(200).json({
      success: true,
      data: {
        users: userStats,
        videos: videoStats,
        subscriptions: subscriptionStats
      }
    });

  } catch (error) {
    console.error("Get System Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users with pagination and filters
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, userType, isActive, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (userType) whereClause.userType = userType;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phoneNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await Users.findAndCountAll({
      where: whereClause,
      attributes: { 
        exclude: ['password', 'verificationCode', 'resetToken', 'resetTokenExpires'] 
      },
      include: [
        {
          model: Subscriptions,
          as: 'subscriptions',
          required: false,
          where: { status: 'active' }
        },
        {
          model: Videos,
          as: 'favorites',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Enhance users with additional data
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const watchHistoryCount = await WatchHistory.count({ where: { userId: user.id } });
        const downloadsCount = await Downloads.count({ where: { userId: user.id } });
        
        return {
          ...user.toJSON(),
          stats: {
            watchHistoryCount,
            downloadsCount,
            favoritesCount: user.favorites ? user.favorites.length : 0,
            activeSubscription: user.subscriptions && user.subscriptions.length > 0
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: usersWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalUsers: count
      }
    });

  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user role/status
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType, isActive, name, phoneNumber } = req.body;

    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent self-demotion
    if (userId === req.user.id && userType && userType !== 'admin') {
      return res.status(400).json({
        success: false,
        message: "Cannot remove your own admin privileges"
      });
    }

    const updates = {};
    if (userType) updates.userType = userType;
    if (isActive !== undefined) updates.isActive = isActive;
    if (name) updates.name = name;
    if (phoneNumber) updates.phoneNumber = phoneNumber;

    await user.update(updates);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user
    });

  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user (with cleanup checks)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account"
      });
    }

    const user = await Users.findByPk(userId, {
      include: [
        { 
          model: Videos, 
          as: 'favorites',
          attributes: ['id']
        },
        {
          model: Subscriptions,
          as: 'subscriptions',
          attributes: ['id']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user has active subscription
    const activeSubscription = user.subscriptions && user.subscriptions.some(sub => sub.status === 'active');
    if (activeSubscription) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete user with active subscription. Cancel subscription first."
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pending moderation content
const getPendingContent = async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { status: 'pending' };
    if (category) whereClause.category = category;

    const { count, rows: videos } = await Videos.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ContentCreators,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: videos,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalPending: count
      }
    });

  } catch (error) {
    console.error("Get Pending Content Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Moderate video (approve/reject)
const moderateVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { status, moderationNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'"
      });
    }

    const video = await Videos.findByPk(videoId, {
      include: [{
        model: ContentCreators,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    await video.update({
      status,
      moderationNotes,
      moderatedAt: new Date(),
      moderatedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: `Video ${status} successfully`,
      data: video
    });

  } catch (error) {
    console.error("Moderate Video Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk moderate videos
const bulkModerateVideos = async (req, res) => {
  try {
    const { videoIds, status, moderationNotes } = req.body;

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Video IDs array is required"
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'"
      });
    }

    const updatedCount = await Videos.update({
      status,
      moderationNotes,
      moderatedAt: new Date(),
      moderatedBy: req.user.id
    }, {
      where: {
        id: { [Op.in]: videoIds },
        status: 'pending' // Only update pending videos
      }
    });

    res.status(200).json({
      success: true,
      message: `Bulk moderation completed. ${updatedCount[0]} videos ${status}.`,
      data: { updatedCount: updatedCount[0] }
    });

  } catch (error) {
    console.error("Bulk Moderate Videos Error:", error);
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

module.exports = {
  getAdminDashboard,
  getSystemStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getPendingContent,
  moderateVideo,
  bulkModerateVideos
};