module.exports = (sequelize, DataTypes) => {
  const Payments = sequelize.define("Payments", {
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "NGN", // or USD/KES depending on your region
    },
    paymentProvider: {
      type: DataTypes.ENUM("Paystack", "Flutterwave"),
      allowNull: false,
    },
    paymentRef: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Reference returned by the payment gateway
    },
    status: {
      type: DataTypes.ENUM("pending", "successful", "failed"),
      defaultValue: "pending",
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true, // Filled when payment is successful
    },
  });

  Payments.associate = (models) => {
    // Link payment to a user
    Payments.belongsTo(models.Users, { foreignKey: "userId", as: "user" });

    // Optionally link payment to a subscription
    Payments.belongsTo(models.Subscriptions, { foreignKey: "subscriptionId", as: "subscription" });
  };

  return Payments;
};
