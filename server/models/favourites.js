module.exports = (sequelize, DataTypes) => {
  const Favorites = sequelize.define("Favorites", {});

  Favorites.associate = (models) => {
    Favorites.belongsTo(models.Users, { foreignKey: "userId", as: "user" });
    Favorites.belongsTo(models.Videos, { foreignKey: "videoId", as: "video" });
  };

  return Favorites;
};
