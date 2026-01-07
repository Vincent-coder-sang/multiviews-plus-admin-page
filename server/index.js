
const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const videoRoutes = require("./routes/videoRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const contentCreatorsRoutes = require("./routes/contentCreatorsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const favoritesRoutes = require("./routes/favoritesRoutes");
const videoLikesRoutes = require("./routes/videoLikesRoutes");
const videoViewsRoutes = require("./routes/videoViewsRoutes");
const watchHistoryRoutes = require("./routes/watchHistoryRoutes");
const downloadsRoutes = require("./routes/downloadsRoutes");

const port = process.env.PORT || 3001;
dotenv.config();
const app = express();


app.use(express.json());
app.use(cookieParser());


app.use(
  cors({
    origin: "https://multiviews-plus-website.onrender.com", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, 
    allowedHeaders: ['Content-Type', 'Authorization'], 
  })
);

const db = require("./models");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/creators", contentCreatorsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/likes", videoLikesRoutes);
app.use("/api/views", videoViewsRoutes);
app.use("/api/watch-history", watchHistoryRoutes);
app.use("/api/downloads", downloadsRoutes);


  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/dist")));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client", "dist", "index.html"));
  });
  }

db.sequelize.sync({ force: false, alter: false }).then(() => {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
