module.exports = (sequelize, DataTypes) => {
  const VideoViews = sequelize.define("VideoViews", {
    watchedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    // ✅ ADD FOR ROYALTY CALCULATIONS:
    watchDuration: { type: DataTypes.INTEGER, defaultValue: 0 }, // seconds watched
    totalDuration: { type: DataTypes.INTEGER }, // total video duration
    watchPercentage: { type: DataTypes.FLOAT, defaultValue: 0 }, // % of video watched
    qualifiedView: { type: DataTypes.BOOLEAN, defaultValue: false } // Counts for royalties
  });

  VideoViews.associate = (models) => {
    VideoViews.belongsTo(models.Users, { foreignKey: "userId", as: "user" });
    VideoViews.belongsTo(models.Videos, { foreignKey: "videoId", as: "video" });
  };

  return VideoViews;
};