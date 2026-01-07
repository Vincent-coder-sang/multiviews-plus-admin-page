/** @format */
// routes/userRoutes.js
const express = require("express");
const {
  deleteUser,
  updateUser,
  getUsers,
  getUserById,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");
const { isAuthenticated, isAdmin } = require("../middlewares/AuthMiddleware");

const router = express.Router();

// User routes
router.get("/profile", isAuthenticated, getUserProfile);
router.put("/profile", isAuthenticated, updateUserProfile);

// Admin routes
router.get("/get", isAuthenticated, isAdmin, getUsers);
router.get("/get/:userId", isAuthenticated, isAdmin, getUserById);
router.put("/update/:userId", isAuthenticated, isAdmin, updateUser);
router.delete("/delete/:userId", isAuthenticated, isAdmin, deleteUser);

module.exports = router;