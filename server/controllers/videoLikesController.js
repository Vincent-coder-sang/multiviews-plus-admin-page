/** @format */
// controllers/videoLikesController.js
const { VideoLikes, Videos, Users, ContentCreators } = require("../models");
const { Op } = require("sequelize");

// Like/unlike video
const likeVideo = async (req, res) => {
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

    // Check if user already liked this video
    const existingLike = await VideoLikes.findOne({
      where: { userId, videoId }
    });

    if (existingLike) {
      // Unlike the video
      await existingLike.destroy();
      
      return res.status(200).json({
        success: true,
        message: "Video unliked successfully",
        data: {
          liked: false,
          likesCount: await VideoLikes.count({ where: { videoId } })
        }
      });
    } else {
      // Like the video
      await VideoLikes.create({
        userId,
        videoId,
        likedAt: new Date()
      });

      return res.status(200).json({
        success: true,
        message: "Video liked successfully",
        data: {
          liked: true,
          likesCount: await VideoLikes.count({ where: { videoId } })
        }
      });
    }

  } catch (error) {
    console.error("Like Video Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get like count for video
const getVideoLikes = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.id;

    // Check if video exists
    const video = await Videos.findByPk(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    const likesCount = await VideoLikes.count({ where: { videoId } });
    
    // Check if current user liked this video
    let userLiked = false;
    if (userId) {
      const userLike = await VideoLikes.findOne({
        where: { userId, videoId }
      });
      userLiked = !!userLike;
    }

    res.status(200).json({
      success: true,
      data: {
        videoId: parseInt(videoId),
        likesCount,
        userLiked
      }
    });

  } catch (error) {
    console.error("Get Video Likes Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get videos user liked
const getUserLikedVideos = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Check if user is accessing their own likes or is admin
    if (userId !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own liked videos."
      });
    }

    const { count, rows: likes } = await VideoLikes.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Videos,
          as: 'video',
          attributes: ['id', 'name', 'thumbnailUrl', 'duration', 'category']
        }
      ],
      order: [['likedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const likedVideos = likes.map(like => ({
      id: like.id,
      likedAt: like.likedAt,
      video: like.video
    }));

    res.status(200).json({
      success: true,
      data: likedVideos,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalLikes: count
      }
    });

  } catch (error) {
    console.error("Get User Liked Videos Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  likeVideo,
  getVideoLikes,
  getUserLikedVideos
};