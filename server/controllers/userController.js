/** @format */
const { Users } = require("../models");
const bcryptjs = require("bcryptjs");
const { Op } = require("sequelize");

const deleteUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const deletedUser = await Users.destroy({
      where: {
        id: userId,
      },
    });

    res.status(201).json({ 
      success: true, 
      data: deletedUser, 
      message: "User deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  const userId = req.params.userId;
  const { email, name, password, phoneNumber, userType } = req.body;

  try {
    if (!email || !name || !phoneNumber || !userType) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "User not found." 
      });
    }

    const checkEmail = await Users.findOne({
      where: { email, id: { [Op.ne]: userId } },
    });

    if (checkEmail) {
      return res.status(400).json({
        success: false,
        message: "This email is already in use.",
      });
    }

    const hashedPassword = password
      ? await bcryptjs.hash(password, await bcryptjs.genSalt(10))
      : user.password;

    await Users.update(
      { email, name, password: hashedPassword, phoneNumber, userType },
      { where: { id: userId } }
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: { email, name, phoneNumber, userType },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: { exclude: ['password'] }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await Users.findOne({ 
      where: { id: userId },
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const userId = req.user.id;
    const user = await Users.findOne({ 
      where: { id: userId },
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  const { name, email, phoneNumber } = req.body;

  if (!name || !email || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "All fields are required (name, email, phone number).",
    });
  }

  try {
    const userId = req.user.id;

    const user = await Users.findByPk(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const existingEmail = await Users.findOne({
      where: {
        email,
        id: { [Op.ne]: userId },
      },
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "This email is already in use.",
      });
    }

    await user.update({ name, email, phoneNumber });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  deleteUser,
  updateUser,
  getUsers,
  getUserById,
  getUserProfile,
  updateUserProfile,
};