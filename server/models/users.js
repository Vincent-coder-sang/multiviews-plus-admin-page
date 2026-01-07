/** @format */

module.exports = (sequelize, DataTypes) => {
	const Users = sequelize.define("Users", {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		phoneNumber: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		verificationCode: {
			type: DataTypes.STRING(6),
			allowNull: true,
		},
		verified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		isActive: {
  type: DataTypes.BOOLEAN,
  defaultValue: true
},
		// In Users model, add these fields:
resetToken: {
  type: DataTypes.STRING,
  allowNull: true
},
resetTokenExpires: {
  type: DataTypes.DATE,
  allowNull: true
},
		userType: {
			type: DataTypes.ENUM("admin", "client", "premium"),
			allowNull: true,
			defaultValue: "client",
		},
	});

	Users.associate = (models) => {
    Users.hasMany(models.Subscriptions, { foreignKey: "userId", as: "subscriptions", onDelete: "cascade" });
    Users.hasMany(models.Downloads, { foreignKey: "userId", as: "downloads", onDelete: "cascade" });
    Users.hasMany(models.WatchHistory, { foreignKey: "userId", as: "watchHistory", onDelete: "cascade" });
    Users.hasMany(models.VideoViews, { foreignKey: "userId", as: "videoViews", onDelete: "cascade" });
    Users.hasMany(models.VideoLikes, { foreignKey: "userId", as: "videoLikes", onDelete: "cascade" });
    Users.belongsToMany(models.Videos, { through: models.Favorites, foreignKey: "userId", as: "favorites" });
  };

	return Users;
};
