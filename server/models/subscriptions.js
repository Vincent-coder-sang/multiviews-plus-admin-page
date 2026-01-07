module.exports = (sequelize, DataTypes) => {
  const Subscriptions = sequelize.define("Subscriptions", {
    planType: { 
      type: DataTypes.ENUM("basic", "premium", "family"), // ✅ Specific plans
      allowNull: false 
    },
    billingCycle: { 
      type: DataTypes.ENUM("monthly", "yearly"), // ✅ ADD THIS
      allowNull: false 
    },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    status: { 
      type: DataTypes.ENUM("active", "expired", "cancelled", "past_due"), // ✅ Added past_due
      defaultValue: "active" 
    },
    // ✅ ADD THESE FOR PAYMENT INTEGRATION:
    stripeSubscriptionId: { type: DataTypes.STRING }, // Or paystack reference
    paymentMethod: { type: DataTypes.STRING }, // "card", "bank_transfer"
  });

  Subscriptions.associate = (models) => {
    Subscriptions.belongsTo(models.Users, { foreignKey: "userId", as: "user" });
    Subscriptions.hasMany(models.Payments, { // ✅ ADD THIS
      foreignKey: "subscriptionId", 
      as: "payments" 
    });
  };

  return Subscriptions;
};