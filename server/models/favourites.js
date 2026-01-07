module.exports = (sequelize, DataTypes) => {
  const Favorites = sequelize.define("Favorites", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // Reference Users table
        key: 'id'
      }
    },
    videoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Videos', // Reference Videos table
        key: 'id'
      }
    },
  });


  Favorites.associate = (models) => {
    Favorites.belongsTo(models.Users, { foreignKey: "userId", as: "user",onDelete: 'CASCADE' });
    Favorites.belongsTo(models.Videos, { foreignKey: "videoId", as: "video", onDelete: 'CASCADE' });
  };

  return Favorites;
};
