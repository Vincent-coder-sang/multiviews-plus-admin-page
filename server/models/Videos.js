/** @format */

module.exports = (sequelize, DataTypes) => {
	const Videos = sequelize.define("Videos", {
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		desc: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		videoUrl: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		thumbnailUrl: { type: DataTypes.STRING, allowNull: true },
		category: {
			type: DataTypes.ENUM(
				"Korean Series",
				"Documentaries",
				"Nollywood Movies",
				"Hollywood Movies",
				"Animations",
				"Family",
				"TV Shows"
			),
			allowNull: false,
		},
		publicId: {
			type: DataTypes.STRING,
			allowNull: true, // Can be null initially
		},
		duration: {
			type: DataTypes.FLOAT,
			allowNull: true, // Cloudinary provides this for videos
		},
		format: {
			type: DataTypes.STRING,
			allowNull: true, // Cloudinary provides this (mp4, mov, etc.)
		},
		fileSize: {
			type: DataTypes.INTEGER,
			allowNull: true, // Optional: store file size in bytes
		},
		creatorId: {
  type: DataTypes.INTEGER,
  references: { model: "ContentCreators", key: "id" }
},
status: {
  type: DataTypes.ENUM('pending', 'approved', 'rejected'),
  defaultValue: 'pending'
},
moderationNotes: {
  type: DataTypes.TEXT,
  allowNull: true
},
moderatedAt: {
  type: DataTypes.DATE,
  allowNull: true
},
moderatedBy: {
  type: DataTypes.INTEGER,
  references: { model: 'Users', key: 'id' },
  allowNull: true
}
	});


	Videos.associate = (models) => {
    Videos.hasMany(models.Downloads, { foreignKey: "videoId", as: "downloads", onDelete: "cascade" });
    Videos.hasMany(models.WatchHistory, { foreignKey: "videoId", as: "watchHistory", onDelete: "cascade" });
    Videos.hasMany(models.VideoViews, { foreignKey: "videoId", as: "videoViews", onDelete: "cascade" });
    Videos.hasMany(models.VideoLikes, { foreignKey: "videoId", as: "videoLikes", onDelete: "cascade" });
    Videos.belongsToMany(models.Users, { through: models.Favorites, foreignKey: "videoId", as: "favoritedBy" });
	Videos.belongsTo(models.ContentCreators, { 
      foreignKey: "creatorId", 
      as: "creator" 
    });
  };

	return Videos;
};