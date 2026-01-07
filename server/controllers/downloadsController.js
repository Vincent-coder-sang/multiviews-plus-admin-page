/** @format */
// controllers/downloadsController.js
const { Downloads, Videos, Users, Subscriptions } = require("../models");
const { Op } = require("sequelize");
const fs = require('fs');
const path = require('path');

// Download video
const downloadVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    // Check if user has active subscription with download access
    const subscription = await Subscriptions.findOne({
      where: { 
        userId, 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required for downloads"
      });
    }

    // Check download limits based on subscription plan
    const downloadsThisMonth = await Downloads.count({
      where: {
        userId,
        downloadedAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    const downloadLimit = getDownloadLimit(subscription.planType);
    if (downloadLimit > 0 && downloadsThisMonth >= downloadLimit) {
      return res.status(403).json({
        success: false,
        message: `Download limit reached. You have used ${downloadsThisMonth}/${downloadLimit} downloads this month.`
      });
    }

    // Get video details
    const video = await Videos.findByPk(videoId, {
      include: [{
        model: Users,
        as: 'creator',
        attributes: ['id', 'name']
      }]
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    // Check if video is downloadable
    if (!video.downloadable) {
      return res.status(403).json({
        success: false,
        message: "This video is not available for download"
      });
    }

    // Check if user already downloaded this video
    const existingDownload = await Downloads.findOne({
      where: { userId, videoId }
    });

    if (existingDownload) {
      return res.status(400).json({
        success: false,
        message: "You have already downloaded this video"
      });
    }

    // Create download record
    const download = await Downloads.create({
      userId,
      videoId,
      downloadedAt: new Date(),
      status: 'completed',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
      fileSize: video.fileSize || 0,
      quality: '720p' // Default quality, you can make this dynamic
    });

    // Simulate download process (in real app, you'd stream the file)
    const downloadInfo = {
      downloadId: download.id,
      video: {
        id: video.id,
        name: video.name,
        duration: video.duration,
        fileSize: video.fileSize
      },
      downloadUrl: video.videoUrl, // In production, use signed URLs
      expiresAt: download.expiresAt,
      remainingDownloads: downloadLimit > 0 ? downloadLimit - downloadsThisMonth - 1 : 'unlimited'
    };

    res.status(200).json({
      success: true,
      message: "Video download started successfully",
      data: downloadInfo
    });

  } catch (error) {
    console.error("Download Video Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's downloads
const getUserDownloads = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is accessing their own downloads or is admin
    if (userId !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own downloads."
      });
    }

    const whereClause = { userId };
    if (status) whereClause.status = status;

    const { count, rows: downloads } = await Downloads.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Videos,
          as: 'video',
          attributes: ['id', 'name', 'thumbnailUrl', 'duration', 'category'],
          include: [{
            model: Users,
            as: 'creator',
            attributes: ['id', 'name']
          }]
        },
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['downloadedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Check for expired downloads
    const currentTime = new Date();
    const expiredDownloads = downloads.filter(download => 
      download.expiresAt && download.expiresAt < currentTime
    );

    // Update expired downloads status
    if (expiredDownloads.length > 0) {
      await Downloads.update(
        { status: 'expired' },
        {
          where: {
            id: expiredDownloads.map(d => d.id),
            status: 'completed'
          }
        }
      );
    }

    const downloadsWithStatus = downloads.map(download => ({
      ...download.toJSON(),
      isExpired: download.expiresAt && download.expiresAt < currentTime,
      daysRemaining: download.expiresAt ? 
        Math.ceil((download.expiresAt - currentTime) / (24 * 60 * 60 * 1000)) : null
    }));

    // Calculate storage usage
    const totalStorageUsed = await Downloads.sum('fileSize', {
      where: { userId, status: 'completed' }
    }) || 0;

    res.status(200).json({
      success: true,
      data: downloadsWithStatus,
      storage: {
        totalUsed: totalStorageUsed,
        totalUsedMB: (totalStorageUsed / (1024 * 1024)).toFixed(2),
        estimatedSpaceRemaining: 1000 - (totalStorageUsed / (1024 * 1024)) // 1GB limit example
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalDownloads: count,
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Get User Downloads Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete downloaded video
const deleteDownload = async (req, res) => {
  try {
    const { downloadId } = req.params;
    const userId = req.user.id;

    const download = await Downloads.findByPk(downloadId, {
      include: [{
        model: Videos,
        as: 'video'
      }]
    });

    if (!download) {
      return res.status(404).json({
        success: false,
        message: "Download record not found"
      });
    }

    // Check if user owns the download or is admin
    if (download.userId !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own downloads."
      });
    }

    // In a real app, you would delete the actual file from storage
    // For now, we just delete the database record
    
    await download.destroy();

    res.status(200).json({
      success: true,
      message: "Download deleted successfully",
      data: {
        deletedDownloadId: downloadId,
        videoName: download.video?.name
      }
    });

  } catch (error) {
    console.error("Delete Download Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get download statistics
const getDownloadStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalDownloads = await Downloads.count({ where: { userId } });
    const activeDownloads = await Downloads.count({ 
      where: { 
        userId, 
        status: 'completed',
        expiresAt: { [Op.gt]: new Date() }
      }
    });
    
    const expiredDownloads = await Downloads.count({ 
      where: { 
        userId, 
        status: 'expired' 
      }
    });

    const downloadsThisMonth = await Downloads.count({
      where: {
        userId,
        downloadedAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    const subscription = await Subscriptions.findOne({
      where: { 
        userId, 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    const downloadLimit = subscription ? getDownloadLimit(subscription.planType) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalDownloads,
        activeDownloads,
        expiredDownloads,
        downloadsThisMonth,
        downloadLimit,
        remainingDownloads: downloadLimit > 0 ? downloadLimit - downloadsThisMonth : 'unlimited'
      }
    });

  } catch (error) {
    console.error("Get Download Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear expired downloads (Admin function)
const clearExpiredDownloads = async (req, res) => {
  try {
    const expiredCount = await Downloads.count({
      where: {
        expiresAt: { [Op.lt]: new Date() },
        status: 'completed'
      }
    });

    await Downloads.update(
      { status: 'expired' },
      {
        where: {
          expiresAt: { [Op.lt]: new Date() },
          status: 'completed'
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `Marked ${expiredCount} downloads as expired`,
      data: { expiredCount }
    });

  } catch (error) {
    console.error("Clear Expired Downloads Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to get download limit based on subscription plan
const getDownloadLimit = (planType) => {
  const limits = {
    basic: 0,      // No downloads
    premium: 10,   // 10 downloads per month
    family: 30     // 30 downloads per month
  };
  return limits[planType] || 0;
};

module.exports = {
  downloadVideo,
  getUserDownloads,
  deleteDownload,
  getDownloadStats,
  clearExpiredDownloads
};