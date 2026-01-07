
const jwt = require("jsonwebtoken");
const generateAuthToken = (user) => {
  // const key = process.env.SECRET_KEY;
  if (!user || !user.id || !user.email || !user.userType) {
    res.status(401).json({ status: false, message: "User information missing or invalid" });  
  }


  try {
    // Create JWT token with user details
    const token = jwt.sign(
      {
        id: user.id,
        userType: user.userType,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
      "sangkiplaimportantkey",
      {
        expiresIn: '21d', 
      }
    );

    return token;
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

module.exports = generateAuthToken;
