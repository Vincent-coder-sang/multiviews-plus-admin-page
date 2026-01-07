/** @format */
// controllers/contentCreatorsController.js
const { ContentCreators, Videos, VideoViews } = require("../models");
const { Op } = require("sequelize");

const getCreators = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: creators } = await ContentCreators.findAndCountAll({
      where: whereClause,
      include: [{
        model: Videos,
        as: 'videos',
        attributes: ['id', 'name', 'category', 'duration'],
        required: false
      }],
      // ✅ REMOVED: attributes exclusion since we don't have timestamps
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'DESC']] // ✅ CHANGED: Use 'id' instead of 'createdAt'
    });

    // Calculate video counts and total views for each creator
    const creatorsWithStats = await Promise.all(
      creators.map(async (creator) => {
        const videoCount = creator.videos ? creator.videos.length : 0;
        
        // Calculate total views for this creator
        let totalViews = 0;
        if (creator.videos && creator.videos.length > 0) {
          totalViews = await VideoViews.count({
            include: [{
              model: Videos,
              as: 'video',
              where: { creatorId: creator.id },
              attributes: []
            }]
          });
        }

        return {
          id: creator.id,
          name: creator.name,
          email: creator.email,
          paymentDetails: creator.paymentDetails,
          royaltyPercentage: creator.royaltyPercentage,
          isActive: creator.isActive,
          // ✅ REMOVED: createdAt and updatedAt since they don't exist
          stats: {
            videoCount,
            totalViews,
            totalRevenue: await calculateCreatorRevenue(creator.id)
          },
          videos: creator.videos || []
        };
      })
    );

    res.status(200).json({
      success: true,
      data: creatorsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalCreators: count,
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Get Creators Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// In your getCreatorVideos function, update the order clause:
const getCreatorVideos = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { page = 1, limit = 20, category } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { creatorId };
    if (category) whereClause.category = category;

    const { count, rows: videos } = await Videos.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: VideoViews,
          as: 'videoViews',
          attributes: ['id'],
          required: false
        },
        {
          model: require('../models').VideoLikes,
          as: 'videoLikes',
          attributes: ['id'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'DESC']] // ✅ CHANGED: Use 'id' instead of 'createdAt'
    });

    const videosWithStats = videos.map(video => ({
      id: video.id,
      name: video.name,
      category: video.category,
      duration: video.duration,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      // ✅ REMOVED: ...video.toJSON() to avoid timestamp issues
      viewsCount: video.videoViews ? video.videoViews.length : 0,
      likesCount: video.videoLikes ? video.videoLikes.length : 0
    }));

    res.status(200).json({
      success: true,
      data: videosWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalVideos: count
      }
    });
  } catch (error) {
    console.error("Get Creator Videos Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Create new content creator - FIXED VERSION
const createCreator = async (req, res) => {
  try {
    const { name, email, paymentDetails, royaltyPercentage = 0.6 } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required"
      });
    }

    // Check if creator already exists with this email
    const existingCreator = await ContentCreators.findOne({
      where: { email }
    });

    if (existingCreator) {
      return res.status(400).json({
        success: false,
        message: "Content creator with this email already exists"
      });
    }

    // Handle paymentDetails properly
    let processedPaymentDetails = paymentDetails;
    if (typeof paymentDetails === 'string') {
      try {
        processedPaymentDetails = JSON.parse(paymentDetails);
      } catch (parseError) {
        // If it's not valid JSON, store as string
        processedPaymentDetails = paymentDetails;
      }
    }

    const creator = await ContentCreators.create({
      name, 
      email, 
      paymentDetails: processedPaymentDetails || {},
      royaltyPercentage: parseFloat(royaltyPercentage)
    });
    
    res.status(201).json({ 
      success: true, 
      message: "Content creator created successfully",
      data: creator 
    });
  } catch (error) {
    console.error("Create Creator Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get creator by ID - FIXED VERSION
const getCreatorById = async (req, res) => {
  try {
    const { creatorId } = req.params;

    const creator = await ContentCreators.findByPk(creatorId, {
      include: [{
        model: Videos,
        as: 'videos',
        attributes: ['id', 'name', 'category', 'duration', 'videoUrl', 'thumbnailUrl'],
        // ✅ REMOVED: 'createdAt' since it doesn't exist in Videos either?
        include: [{
          model: VideoViews,
          as: 'videoViews',
          attributes: ['id'],
          required: false
        }]
      }]
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Content creator not found"
      });
    }

    // Calculate detailed stats
    const videoCount = creator.videos ? creator.videos.length : 0;
    const totalViews = await VideoViews.count({
      include: [{
        model: Videos,
        as: 'video',
        where: { creatorId: creator.id },
        attributes: []
      }]
    });

    const totalLikes = await require('../models').VideoLikes.count({
      include: [{
        model: require('../models').Videos,
        as: 'video',
        where: { creatorId: creator.id },
        attributes: []
      }]
    });

    const estimatedRevenue = await calculateCreatorRevenue(creator.id);

    res.status(200).json({
      success: true,
      data: {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        paymentDetails: creator.paymentDetails,
        royaltyPercentage: creator.royaltyPercentage,
        isActive: creator.isActive,
        analytics: {
          videoCount,
          totalViews,
          totalLikes,
          estimatedRevenue: parseFloat(estimatedRevenue.toFixed(2)),
          averageViewsPerVideo: videoCount > 0 ? (totalViews / videoCount).toFixed(1) : 0,
          engagementRate: totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : 0
        },
        videos: (creator.videos || []).map(video => ({
          id: video.id,
          name: video.name,
          category: video.category,
          duration: video.duration,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          viewsCount: video.videoViews ? video.videoViews.length : 0
        }))
      }
    });
  } catch (error) {
    console.error("Get Creator By ID Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update content creator
const updateCreator = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { name, email, paymentDetails, royaltyPercentage, isActive } = req.body;

    const creator = await ContentCreators.findByPk(creatorId);
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Content creator not found"
      });
    }

    // Check if email is already taken by another creator
    if (email && email !== creator.email) {
      const existingCreator = await ContentCreators.findOne({
        where: { email, id: { [Op.ne]: creatorId } }
      });

      if (existingCreator) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken by another creator"
        });
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (paymentDetails) updates.paymentDetails = paymentDetails;
    if (royaltyPercentage !== undefined) updates.royaltyPercentage = parseFloat(royaltyPercentage);
    if (isActive !== undefined) updates.isActive = isActive;

    await creator.update(updates);

    res.status(200).json({
      success: true,
      message: "Content creator updated successfully",
      data: creator
    });
  } catch (error) {
    console.error("Update Creator Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete content creator
const deleteCreator = async (req, res) => {
  try {
    const { creatorId } = req.params;

    const creator = await ContentCreators.findByPk(creatorId, {
      include: [{
        model: Videos,
        as: 'videos'
      }]
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Content creator not found"
      });
    }

    // Check if creator has videos
    if (creator.videos.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete creator with existing videos. Please reassign or delete videos first.",
        videoCount: creator.videos.length
      });
    }

    await creator.destroy();

    res.status(200).json({
      success: true,
      message: "Content creator deleted successfully"
    });
  } catch (error) {
    console.error("Delete Creator Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to calculate creator revenue
const calculateCreatorRevenue = async (creatorId) => {
  try {
    const qualifiedViews = await VideoViews.count({
      include: [{
        model: Videos,
        as: 'video',
        where: { creatorId },
        attributes: []
      }],
      where: { qualifiedView: true }
    });

    const creator = await ContentCreators.findByPk(creatorId);
    const revenuePerView = 0.02; // $0.02 per qualified view
    const estimatedRevenue = qualifiedViews * revenuePerView * creator.royaltyPercentage;

    return parseFloat(estimatedRevenue.toFixed(2));
  } catch (error) {
    console.error("Calculate Revenue Error:", error);
    return 0;
  }
};

// Search creators
const searchCreators = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const creators = await ContentCreators.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ]
      },
      include: [{
        model: Videos,
        as: 'videos',
        attributes: ['id', 'name'],
        required: false
      }],
      limit: 20
    });

    res.status(200).json({
      success: true,
      data: creators,
      searchQuery: query
    });
  } catch (error) {
    console.error("Search Creators Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCreator,
  getCreators,
  getCreatorById,
  updateCreator,
  deleteCreator,
  getCreatorVideos,
  searchCreators
};