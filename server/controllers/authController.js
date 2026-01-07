/** @format */
const bcryptjs = require("bcryptjs");
const CryptoJS = require("crypto-js");
const generateOtp = require("../utils/otpGenerator");
const {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} = require("../brevo/email.brevo");
const generateAuthToken = require("../utils/generateAuthToken");
const { Users } = require("../models");

const { Op } = require("sequelize");


const signup = async (req, res) => {
	try {
		let { email, name, password, phoneNumber } = req.body;

		email = email.toLowerCase();

		if (!email || email === "") {
			return res.status(400).json({
				success: false,
				message: "please fill in email!",
			});
		}
		if (!name || name === "") {
			return res.status(400).json({
				success: false,
				message: "please fill in name!",
			});
		}
		if (!phoneNumber || phoneNumber === "") {
			return res.status(400).json({
				success: false,
				message: "please fill in phoneNumber!",
			});
		}
		if (!password || password === "") {
			return res.status(400).json({
				success: false,
				message: "please fill in password!",
			});
		}

		const emailRegez = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!emailRegez.test(email)) {
			return res.status(400).json({
				success: false,
				message: "please use a valid email!",
			});
		}

		const passwordLength = 8;
		const uppercaseRegex = /[A-Z]/;
		const lowercaseRegex = /[a-z]/;
		const numberRegex = /[0-9]/;
		const specialCharacterRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

		if (password.length < passwordLength) {
			return res.status(400).json({
				success: false,
				message: `Password should be at least ${passwordLength} characters`,
			});
		}

		if (!numberRegex.test(password)) {
			return res.status(400).json({
				success: false,
				message: "Password should contain at least one digit",
			});
		}
		if (!uppercaseRegex.test(password)) {
			return res.status(400).json({
				success: false,
				message: "Password should contain at least one uppercase letter",
			});
		}

		if (!lowercaseRegex.test(password)) {
			return res.status(400).json({
				success: false,
				message: "Password should contain at least one lowercase letter",
			});
		}

		if (!specialCharacterRegex.test(password)) {
			return res.status(400).json({
				success: false,
				message: "Password should contain at least one special character",
			});
		}

		const existingUser = await Users.findOne({ where: { email: email } });

		if (existingUser) {
			return res
				.status(400)
				.json({ success: false, message: "User Already Registered" });
		}

		const hashPassword = await bcryptjs.hash(password, 10);

		const verificationCode = generateOtp();

		const user = await Users.create({
			email: email,
			name: name,
			phoneNumber: phoneNumber,
			verificationCode: verificationCode,
			password: hashPassword,
		});
	
		

		res.status(200).json({
			success: true,
			message: "User registered successfully ",
			data: user,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || email === "") {
			return res.status(400).json({
				success: false,
				message: "please fill in email!",
			});
		}

		if (!password || password === "") {
			return res.status(400).json({
				success: false,
				message: "please fill in password!",
			});
		}

		const emailRegez = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!emailRegez.test(email)) {
			return res.status(400).json({
				success: false,
				message: "please use a valid email!",
			});
		}

		const user = await Users.findOne({ where: { email: email } });

		if (!user) {
			return res.json({ success: false, message: "Wrong login credentials" });
		}

		const match = await bcryptjs.compare(password, user.password);

		if (!match) {
			return res.json({
				success: false,
				message: "Wrong login credentials",
			});
		}
		const userToken = generateAuthToken(user)

		res.status(200).json({success: true, message: "Login success", token: userToken, data: { // ADD THIS
    id: user.id,
    name: user.name,
    email: user.email,
    userType: user.userType
  } });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await Users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate a reset token using crypto
    const resetToken = CryptoJS.lib.WordArray.random(20).toString(
      CryptoJS.enc.Hex
    );
    const resetTokenExpires = Date.now() + 3600000; // Token expires in 1 hour

    // Save the reset token and expiration time to the user's record
    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpires;
    await user.save();

    // Send an email to the user with the reset link
    const resetLink = `https://multiviews-plus-website.onrender.com/auth/reset-password/${resetToken}`;

    sendPasswordResetEmail(email, resetLink);

    res
      .status(200)
      .json({ success: true, message: "Password reset link sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const changePassword = async (req, res) => {
  try {
    const token = req.params.token;
    const password = req.body.password;

    // Check if newPassword is provided
    if (!password || !token) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
      });
    }

    const user = await Users.findOne({
      where: {
        resetToken: token,
        resetTokenExpires: { [Op.gt]: new Date() },
		
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Update password and clear reset token
    const hashedPassword = await bcryptjs.hash(password, 12);
    await user.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    });

    await sendResetSuccessEmail(user.email);

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
	login,
	signup,
	forgotPassword,
	changePassword,
};

