// models/ContentCreators.js
module.exports = (sequelize, DataTypes) => {
  const ContentCreators = sequelize.define("ContentCreators", {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    paymentDetails: { type: DataTypes.TEXT },
    royaltyPercentage: { type: DataTypes.FLOAT, defaultValue: 0.6 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    timestamps: true, // ✅ Add this line to enable createdAt and updatedAt
    tableName: "ContentCreators"
  });

  ContentCreators.associate = (models) => {
    ContentCreators.hasMany(models.Videos, { 
      foreignKey: "creatorId", 
      as: "videos" 
    });
  };

  return ContentCreators;
};