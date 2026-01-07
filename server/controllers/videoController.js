/** @format */
const { mediaUploadUtil, deleteMediaUtil, getPublicIdFromUrl } = require("../utils/cloudinary");
const { Videos, ContentCreators, VideoViews } = require("../models");
const { Op } = require("sequelize");

const handleVideoUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    console.log("Uploading to Cloudinary...");
    const result = await mediaUploadUtil(req.file);
    console.log("Cloudinary Response:", result);

    res.status(200).json({ 
      success: true, 
      message: "Video uploaded successfully", 
      result 
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
const createVideo = async (req, res) => {
  const { name, desc, category, creatorId } = req.body;

  try {
    if (!name || !desc || !category || !creatorId) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, desc, category, creatorId) are required",
      });
    }

    // Verify creator exists
    const creator = await ContentCreators.findByPk(creatorId);
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Content creator not found"
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No video file uploaded" 
      });
    }

    console.log("Uploading video to Cloudinary...");
    const result = await mediaUploadUtil(req.file);
    
    if (!result || !result.secure_url) {
      return res.status(400).json({ 
        success: false, 
        message: "Video upload failed" 
      });
    }

    // Create video object with all metadata
    const video = {
      name,
      desc,
      videoUrl: result.secure_url,
      category,
      publicId: result.public_id,
      duration: result.duration,
      format: result.format,
      fileSize: result.bytes,
      creatorId,
    };

    const newVideo = await Videos.create(video);

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      data: newVideo,
    });
  } catch (error) {
    console.error("Create Video Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Delete a video
const deleteVideo = async (req, res) => {
  const videoId = req.params.videoId;

  if (!videoId || isNaN(videoId)) {
    return res.status(400).json({ success: false, message: "Invalid video ID" });
  }

  try {
    const video = await Videos.findByPk(videoId);
    if (!video) return res.status(404).json({ 
      success: false, 
      message: "Video not found" 
    });

    // Use stored publicId or extract from URL
    const publicId = video.publicId || getPublicIdFromUrl(video.videoUrl);
    
    if (!publicId) {
      return res.status(400).json({ 
        success: false, 
        message: "Could not find video ID for deletion" 
      });
    }

    console.log("Deleting from Cloudinary, Public ID:", publicId);
    
    // Delete from Cloudinary - specify resource_type as 'video'
    try {
      await deleteMediaUtil(publicId, 'video');
    } catch (error) {
      console.error("Cloudinary deletion error:", error);
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete video from database
    await Videos.destroy({ where: { id: videoId } });

    res.status(200).json({ 
      success: true, 
      message: "Video deleted successfully" 
    });
  } catch (error) {
    console.error("Delete Video Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a video by ID
const getVideoById = async (req, res) => {
  const videoId = req.params.videoId;
  try {
    const video = await Videos.findByPk(videoId,  {
      include: [{
        model: ContentCreators,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }]
    });
//no need to increament views here 
    if (video) {
      res.status(200).json({
        success: true,
        data: video
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: "Video not found" 
      });
    }
  } catch (error) {
    console.error("Get Video By ID Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all videos
const getVideos = async (req, res) => {
  const category = req.query.category;

  try {
    const whereClause = category ? { category } : {};
    
    const videos = await Videos.findAll({
      where: whereClause,
      include: [{
        model: ContentCreators, // ✅ Include creator info
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }],
      attributes: { exclude: ["createdAt", "updatedAt"] },
    });

    res.status(200).json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error("Get Videos Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a video
const updateVideo = async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const { name, desc, category, creatorId } = req.body;
    const video = await Videos.findByPk(videoId);

    if (!video) return res.status(404).json({ 
      success: false, 
      message: "Video not found" 
    });
    
    if (!name || !desc || !category) return res.status(400).json({ 
      success: false, 
      message: "All fields (name, desc, category) are required" 
    });

    let updatedVideoUrl = video.videoUrl;
    let newPublicId = video.publicId;

    if (req.file) {
      try {
        console.log("Updating video file...");

        // Delete old video from Cloudinary if exists
        if (video.publicId) {
          try {
            await deleteMediaUtil(video.publicId, 'video');
          } catch (error) {
            console.error("Error deleting old video:", error.message);
          }
        }

        // Upload new video
        const uploadResponse = await mediaUploadUtil(req.file);
        updatedVideoUrl = uploadResponse.secure_url;
        newPublicId = uploadResponse.public_id;
      } catch (error) {
        console.error("Error updating video:", error.message);
        return res.status(500).json({ 
          success: false, 
          message: `Video update failed: ${error.message}` 
        });
      }
    }

    await video.update({ 
      name, 
      desc, 
      category,
      creatorId,
      videoUrl: updatedVideoUrl,
      publicId: newPublicId
    });

    res.status(200).json({ 
      success: true, 
      message: "Video updated successfully",
      data: video
    });
  } catch (error) {
    console.error("Update Video Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const searchVideos = async (req, res) => {
  const { query, category } = req.query;
  
  try {
    if (!query) {
      return res.status(400).json({
        success: false, // ✅ Changed from 'status'
        message: "Search query is required"
      });
    }

    const whereClause = {
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { desc: { [Op.like]: `%${query}%` } }
      ]
    };

    if (category) {
      whereClause.category = category;
    }

    const videos = await Videos.findAll({
      where: whereClause,
      include: [{
        model: ContentCreators,
        as: 'creator',
        attributes: ['id', 'name']
      }],
      attributes: { exclude: ["createdAt", "updatedAt"] }
    });

    res.status(200).json({
      success: true, // ✅ Changed from 'status'
      data: videos,
      searchQuery: query
    });
  } catch (error) {
    console.error("Search Videos Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getRandomVideos = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  try {
    // More efficient random selection for large datasets
    const videos = await Videos.findAll({
      include: [{
        model: ContentCreators,
        as: 'creator',
        attributes: ['id', 'name']
      }],
      attributes: { exclude: ["createdAt", "updatedAt"] },
      order: sequelize.random(), // ✅ Use Sequelize random for better performance
      limit
    });

    res.status(200).json({
      status: true,
      data: videos
    });
  } catch (error) {
    console.error("Get Random Videos Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

const getVideosByCreator = async (req, res) => {
  const creatorId = req.params.creatorId;

  try {
    const creator = await ContentCreators.findByPk(creatorId);
    if (!creator) {
      return res.status(404).json({
        success: false, // ✅ Changed from 'status'
        message: "Content creator not found"
      });
    }

    const videos = await Videos.findAll({
      where: { creatorId },
      include: [{
        model: ContentCreators,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }],
      attributes: { exclude: ["createdAt", "updatedAt"] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true, // ✅ Changed from 'status'
      data: videos,
      creator: {
        id: creator.id,
        name: creator.name,
        email: creator.email
      },
      totalVideos: videos.length
    });
  } catch (error) {
    console.error("Get Videos By Creator Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createVideo,
  getVideos,
  updateVideo,
  deleteVideo,
  getVideoById,
  getRandomVideos,
  handleVideoUpload,
  searchVideos,
  getVideosByCreator
};