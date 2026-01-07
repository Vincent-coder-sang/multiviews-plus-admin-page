/** @format */

const express = require("express");
const {
  createVideo,
  getVideos,
  updateVideo,
  deleteVideo,
  getVideoById,
  getRandomVideos,
  searchVideos,
  getVideosByCreator,
  likeVideo,
} = require("../controllers/videoController");

const { upload } = require("../utils/cloudinary");

const router = express.Router();

// Your current structure with improved field name
router.delete("/delete/:videoId", deleteVideo);
router.get("/get", getVideos);
router.get("/get/:videoId", getVideoById);
router.get("/get/creator/:creatorId", getVideosByCreator);
router.get("/get/random", getRandomVideos);
router.put("/update/:videoId", upload.single("video"), updateVideo); // Changed to "video"
router.post("/create", upload.single("video"), createVideo); // Changed to "video"
router.get("/search", searchVideos);

module.exports = router;