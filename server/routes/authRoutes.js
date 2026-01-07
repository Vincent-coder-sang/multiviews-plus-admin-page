/** @format */
const express = require("express");
const {
 
 
  login,
  signup,
  forgotPassword,
  changePassword,
  refreshToken,
} = require("../controllers/authController");
const { verifyToken } = require("../middlewares/AuthMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/change-password/:token", changePassword);

module.exports = router;
