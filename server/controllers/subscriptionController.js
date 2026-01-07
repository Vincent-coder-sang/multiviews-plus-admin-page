/** @format */
const { Subscriptions, Users, Payments, Videos, ContentCreators } = require("../models");
const { Op } = require("sequelize");

// Define subscription plans with features
const SUBSCRIPTION_PLANS = {
  basic: {
    name: "Basic",
    priceMonthly: 4.99,
    priceYearly: 49.99, // ~2 months free
    maxVideoQuality: "720p",
    allowsDownloads: false,
    maxConcurrentStreams: 1,
    adFree: false,
    downloadLimit: 0
  },
  premium: {
    name: "Premium", 
    priceMonthly: 9.99,
    priceYearly: 99.99, // ~2 months free
    maxVideoQuality: "1080p",
    allowsDownloads: true,
    maxConcurrentStreams: 3,
    adFree: true,
    downloadLimit: 10
  },
  family: {
    name: "Family",
    priceMonthly: 14.99,
    priceYearly: 149.99, // ~2 months free
    maxVideoQuality: "4k",
    allowsDownloads: true,
    maxConcurrentStreams: 5,
    adFree: true,
    downloadLimit: 30
  }
};

// Create new subscription
const createSubscription = async (req, res) => {
  try {
    const { userId, planType, billingCycle } = req.body;

    if (!userId || !planType || !billingCycle) {
      return res.status(400).json({
        success: false,
        message: "userId, planType, and billingCycle are required"
      });
    }

    // Validate plan type
    if (!SUBSCRIPTION_PLANS[planType]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan type. Choose from: basic, premium, family"
      });
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        message: "Invalid billing cycle. Choose from: monthly, yearly"
      });
    }

    // Check if user exists
    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check for existing active subscription
    const existingSubscription = await Subscriptions.findOne({
      where: { 
        userId, 
        status: 'active' 
      }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "User already has an active subscription"
      });
    }

    // Calculate subscription details
    const plan = SUBSCRIPTION_PLANS[planType];
    const amount = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    const startDate = new Date();
    const endDate = new Date();
    
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create subscription
    const subscription = await Subscriptions.create({
      userId,
      planType,
      amount,
      billingCycle,
      startDate,
      endDate,
      status: 'active'
    });

    // Update user type to premium
    await user.update({ userType: 'premium' });

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: {
        subscription,
        planDetails: plan
      }
    });

  } catch (error) {
    console.error("Create Subscription Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's current subscription
const getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await Subscriptions.findOne({
      where: { 
        userId, 
        status: 'active' 
      },
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'name', 'email', 'userType']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found"
      });
    }

    const planDetails = SUBSCRIPTION_PLANS[subscription.planType];

    res.status(200).json({
      success: true,
      data: {
        subscription,
        planDetails,
        features: {
          maxVideoQuality: planDetails.maxVideoQuality,
          allowsDownloads: planDetails.allowsDownloads,
          maxConcurrentStreams: planDetails.maxConcurrentStreams,
          adFree: planDetails.adFree,
          downloadLimit: planDetails.downloadLimit
        }
      }
    });

  } catch (error) {
    console.error("Get User Subscription Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await Subscriptions.findOne({
      where: { 
        userId, 
        status: 'active' 
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found to cancel"
      });
    }

    // Update subscription status
    await subscription.update({
      status: 'cancelled',
      endDate: new Date() // End immediately
    });

    // Update user type back to client
    await Users.update(
      { userType: 'client' },
      { where: { id: userId } }
    );

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all subscriptions (Admin function)
const getAllSubscriptions = async (req, res) => {
  try {
    const { status, planType } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (planType) whereClause.planType = planType;

    const subscriptions = await Subscriptions.findAll({
      where: whereClause,
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'name', 'email', 'userType']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: subscriptions,
      total: subscriptions.length
    });

  } catch (error) {
    console.error("Get All Subscriptions Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check subscription status
const checkSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await Subscriptions.findOne({
      where: { 
        userId, 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    const hasActiveSubscription = !!subscription;
    const planDetails = subscription ? SUBSCRIPTION_PLANS[subscription.planType] : null;

    res.status(200).json({
      success: true,
      data: {
        hasActiveSubscription,
        subscription,
        planDetails,
        features: planDetails ? {
          maxVideoQuality: planDetails.maxVideoQuality,
          allowsDownloads: planDetails.allowsDownloads,
          maxConcurrentStreams: planDetails.maxConcurrentStreams,
          adFree: planDetails.adFree,
          downloadLimit: planDetails.downloadLimit
        } : null
      }
    });

  } catch (error) {
    console.error("Check Subscription Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get subscription plans (Public endpoint)
const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      features: {
        maxVideoQuality: plan.maxVideoQuality,
        allowsDownloads: plan.allowsDownloads,
        maxConcurrentStreams: plan.maxConcurrentStreams,
        adFree: plan.adFree,
        downloadLimit: plan.downloadLimit
      },
      yearlySavings: Math.round(((plan.priceMonthly * 12 - plan.priceYearly) / (plan.priceMonthly * 12)) * 100)
    }));

    res.status(200).json({
      success: true,
      data: plans
    });

  } catch (error) {
    console.error("Get Subscription Plans Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check feature access
const checkFeatureAccess = async (req, res) => {
  try {
    const { userId, feature } = req.params;

    const subscription = await Subscriptions.findOne({
      where: { 
        userId, 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    if (!subscription) {
      return res.status(200).json({
        success: true,
        hasAccess: false,
        message: "No active subscription"
      });
    }

    const plan = SUBSCRIPTION_PLANS[subscription.planType];
    let hasAccess = false;

    switch (feature) {
      case 'download':
        hasAccess = plan.allowsDownloads;
        break;
      case 'hd_quality':
        hasAccess = ['1080p', '4k'].includes(plan.maxVideoQuality);
        break;
      case 'ad_free':
        hasAccess = plan.adFree;
        break;
      case 'premium_content':
        hasAccess = ['premium', 'family'].includes(subscription.planType);
        break;
      default:
        hasAccess = false;
    }

    res.status(200).json({
      success: true,
      hasAccess,
      feature,
      plan: subscription.planType
    });

  } catch (error) {
    console.error("Check Feature Access Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update subscription (Admin function - upgrade/downgrade)
const updateSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { planType, billingCycle, status } = req.body;

    const subscription = await Subscriptions.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    const updates = {};
    if (planType && SUBSCRIPTION_PLANS[planType]) {
      updates.planType = planType;
      const plan = SUBSCRIPTION_PLANS[planType];
      updates.amount = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    }

    if (billingCycle) {
      updates.billingCycle = billingCycle;
      const plan = SUBSCRIPTION_PLANS[updates.planType || subscription.planType];
      updates.amount = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    }

    if (status) {
      updates.status = status;
      
      // Update user type based on subscription status
      if (status === 'active') {
        await Users.update(
          { userType: 'premium' },
          { where: { id: subscription.userId } }
        );
      } else if (status === 'cancelled' || status === 'expired') {
        await Users.update(
          { userType: 'client' },
          { where: { id: subscription.userId } }
        );
      }
    }

    await subscription.update(updates);

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: subscription
    });

  } catch (error) {
    console.error("Update Subscription Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check for expired subscriptions (Cron job function)
const checkExpiredSubscriptions = async (req, res) => {
  try {
    const expiredSubscriptions = await Subscriptions.findAll({
      where: {
        status: 'active',
        endDate: { [Op.lt]: new Date() }
      }
    });

    for (const subscription of expiredSubscriptions) {
      await subscription.update({ status: 'expired' });
      
      // Update user type
      await Users.update(
        { userType: 'client' },
        { where: { id: subscription.userId } }
      );
    }

    res.status(200).json({
      success: true,
      message: `Updated ${expiredSubscriptions.length} expired subscriptions`,
      data: expiredSubscriptions
    });

  } catch (error) {
    console.error("Check Expired Subscriptions Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSubscription,
  getUserSubscription,
  cancelSubscription,
  getAllSubscriptions,
  checkSubscriptionStatus,
  getSubscriptionPlans,
  checkFeatureAccess,
  updateSubscription,
  checkExpiredSubscriptions
};