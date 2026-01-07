module.exports = (sequelize, DataTypes) => {
  const WatchHistory = sequelize.define("WatchHistory", {
    progressSeconds: { type: DataTypes.FLOAT, defaultValue: 0 },
    watchedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  WatchHistory.associate = (models) => {
    WatchHistory.belongsTo(models.Users, { foreignKey: "userId", as: "user" });
    WatchHistory.belongsTo(models.Videos, { foreignKey: "videoId", as: "video" });
  };

  return WatchHistory;
};
