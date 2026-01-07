module.exports = (sequelize, DataTypes) => {
  const VideoLikes = sequelize.define("VideoLikes", {
    likedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  VideoLikes.associate = (models) => {
    VideoLikes.belongsTo(models.Users, { foreignKey: "userId", as: "user" });
    VideoLikes.belongsTo(models.Videos, { foreignKey: "videoId", as: "video" });
  };

  return VideoLikes;
};
