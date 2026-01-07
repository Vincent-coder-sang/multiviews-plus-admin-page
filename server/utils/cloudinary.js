const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const multer = require("multer");
const { URL } = require("url");

const CLOUDINARY_CONFIG = {
  cloud_name: "vincentsang",
  api_key: "455286944547629",
  api_secret: "764okYVYwP9WOp5iXMKS7Oxbr7c",
  upload_preset: "monster",
};

cloudinary.config({
  ...CLOUDINARY_CONFIG,
  secure: true,
});

// Updated file filter to allow both images and videos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"), false);
  }
};

const storage = multer.memoryStorage();

// Updated upload limits for videos (increased file size)
const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB for videos
    files: 1 
  },
});

const imageUploadUtil = async (file) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          upload_preset: CLOUDINARY_CONFIG.upload_preset,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(new Error(`Upload failed: ${error.message}`));
          else resolve(result);
        }
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

// New video upload utility
const videoUploadUtil = async (file) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          upload_preset: CLOUDINARY_CONFIG.upload_preset,
          resource_type: "video",
          chunk_size: 6000000, // 6MB chunks for large files
        },
        (error, result) => {
          if (error) reject(new Error(`Video upload failed: ${error.message}`));
          else resolve(result);
        }
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  } catch (error) {
    throw new Error(`Video upload failed: ${error.message}`);
  }
};

// Generic media upload utility (automatically detects type)
const mediaUploadUtil = async (file) => {
  const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
  
  try {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        upload_preset: CLOUDINARY_CONFIG.upload_preset,
        resource_type: resourceType,
      };

      // Add video-specific options
      if (resourceType === 'video') {
        uploadOptions.chunk_size = 6000000;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(new Error(`${resourceType} upload failed: ${error.message}`));
          else resolve({ ...result, resource_type: resourceType });
        }
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  } catch (error) {
    throw new Error(`Media upload failed: ${error.message}`);
  }
};

const deleteImageUtil = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
  });
  if (result.result !== "ok")
    throw new Error(`Deletion failed: ${result.result}`);
  return result;
};

// Enhanced delete utility for videos
const deleteVideoUtil = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "video",
    invalidate: true,
  });
  if (result.result !== "ok")
    throw new Error(`Video deletion failed: ${result.result}`);
  return result;
};

// Generic delete utility
const deleteMediaUtil = async (publicId, resourceType = 'image') => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
  if (result.result !== "ok")
    throw new Error(`${resourceType} deletion failed: ${result.result}`);
  return result;
};

const getPublicIdFromUrl = (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    const parts = url.pathname.split("/");
    return parts.slice(7).join("/").split(".")[0];
  } catch {
    return null;
  }
};

module.exports = {
  upload,
  imageUploadUtil,
  videoUploadUtil,
  mediaUploadUtil,
  deleteImageUtil,
  deleteVideoUtil,
  deleteMediaUtil,
  getPublicIdFromUrl,
  CLOUDINARY_CONFIG,
};