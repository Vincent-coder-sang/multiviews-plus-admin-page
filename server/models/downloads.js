module.exports = (sequelize, DataTypes) => {
  const Downloads = sequelize.define("Downloads", {
    // ✅ deviceId removed - you're right, not needed
    downloadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    // ✅ ADD DOWNLOAD STATUS:
    status: { 
      type: DataTypes.ENUM("pending", "downloading", "completed", "failed"),
      defaultValue: "completed" 
    },
    // ✅ ADD FOR OFFLINE ACCESS MANAGEMENT:
    expiresAt: { type: DataTypes.DATE } // When download becomes invalid
  });

  Downloads.associate = (models) => {
    Downloads.belongsTo(models.Users, { foreignKey: "userId", as: "user" });
    Downloads.belongsTo(models.Videos, { foreignKey: "videoId", as: "video" });
  };

  return Downloads;
};