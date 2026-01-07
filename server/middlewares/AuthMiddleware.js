const jwt = require("jsonwebtoken");
const { Users } = require("../models");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["x-auth-token"] || req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You must be authenticated. ",
    });
  }

  // Extract token from Bearer scheme if present
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7, authHeader.length)
    : authHeader;

  try {
    const decoded = jwt.verify(token, "sangkiplaimportantkey");

    // Verify the user still exists in database
    const user = await Users.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token - user not found",
      });
    }

    req.user = {
      id: user.id,
      userType: user.userType,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      verified: user.verified
    };
    next();
  } catch (error) {
    let message = "Invalid token";

    if (error instanceof jwt.TokenExpiredError) {
      message = "Token expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
      message = "Malformed token";
    }

    res
      .status(500)
      .json({ success: false, message: `${message}. Please log in again.` });
  }
};

const verifyTokenAndAuthorization = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      await verifyToken(req, res, () => {}); // First verify token

      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: "Access denied. No user provided.",
        });
      }

      // If no specific roles required, just continue
      if (allowedRoles.length === 0) {
        return next();
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.userType)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient privileges.",
          requiredRoles: allowedRoles,
          yourRole: req.user.userType,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

// Higher-order function for role-based access control
const roleCheck = (requiredRole) => {
  return verifyTokenAndAuthorization([requiredRole]);
};

// Specific role checkers
const isAdmin = roleCheck("admin");
const isClient = roleCheck("client");   // ✅ Match your model
const isPremium = roleCheck("premium"); // ✅ Better naming than "isVip"


// Combined role checkers
const isAdminOrPremium = verifyTokenAndAuthorization(["admin", "premium"]);
const isAdminOrClient = verifyTokenAndAuthorization(["admin", "client"]);
const isPremiumOrClient = verifyTokenAndAuthorization(["premium", "client"]);

// Any authenticated user (regardless of role)
const isAuthenticated = verifyTokenAndAuthorization([]);


// Optional: Check if user is verified
const isVerified = (req, res, next) => {
  if (!req.user.verified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email address to access this resource.",
    });
  }
  next();
};

module.exports = {
   verifyToken,
  verifyTokenAndAuthorization,
  isClient,
  isAdmin,
  isPremium,
  isAdminOrPremium,
  isAdminOrClient,
  isPremiumOrClient,
  isAuthenticated,
  isVerified
};
