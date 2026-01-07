/** @format */
const { Payments, Users, Subscriptions, Videos } = require("../models");
const { Op } = require("sequelize");

// Payment providers configuration
const PAYMENT_PROVIDERS = {
  Paystack: {
    verifyUrl: 'https://api.paystack.co/transaction/verify/',
    secretKey: process.env.PAYSTACK_SECRET_KEY
  },
  Flutterwave: {
    verifyUrl: 'https://api.flutterwave.com/v3/transactions/',
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY
  }
};

// Create payment record
const createPayment = async (req, res) => {
  try {
    const { userId, amount, paymentProvider, paymentRef, subscriptionId, description } = req.body;

    if (!userId || !amount || !paymentProvider || !paymentRef) {
      return res.status(400).json({
        success: false,
        message: "userId, amount, paymentProvider, and paymentRef are required"
      });
    }

    // Validate payment provider
    if (!PAYMENT_PROVIDERS[paymentProvider]) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment provider. Choose from: Paystack, Flutterwave"
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

    // Check if payment reference already exists
    const existingPayment = await Payments.findOne({
      where: { paymentRef }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment reference already exists"
      });
    }

    // Verify payment with provider
    const verificationResult = await verifyPaymentWithProvider(paymentRef, paymentProvider);
    
    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: `Payment verification failed: ${verificationResult.message}`
      });
    }

    // Create payment record
    const payment = await Payments.create({
      userId,
      amount: verificationResult.amount || amount,
      currency: verificationResult.currency || 'NGN',
      paymentProvider,
      paymentRef,
      subscriptionId: subscriptionId || null,
      status: verificationResult.status === 'success' ? 'successful' : 'pending',
      paidAt: verificationResult.paidAt || null,
      description: description || `Payment for ${subscriptionId ? 'subscription' : 'service'}`
    });

    // If payment is for subscription and successful, activate subscription
    if (subscriptionId && payment.status === 'successful') {
      await activateSubscription(subscriptionId);
    }

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment
    });

  } catch (error) {
    console.error("Create Payment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify payment with provider
const verifyPaymentWithProvider = async (paymentRef, provider) => {
  try {
    const config = PAYMENT_PROVIDERS[provider];
    
    const response = await fetch(`${config.verifyUrl}${paymentRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (provider === 'Paystack') {
      return {
        success: data.status === true && data.data.status === 'success',
        amount: data.data.amount / 100, // Convert from kobo
        currency: data.data.currency,
        status: data.data.status,
        paidAt: data.data.paid_at ? new Date(data.data.paid_at) : null,
        message: data.message
      };
    } else if (provider === 'Flutterwave') {
      return {
        success: data.status === 'success' && data.data.status === 'successful',
        amount: parseFloat(data.data.amount),
        currency: data.data.currency,
        status: data.data.status,
        paidAt: data.data.created_at ? new Date(data.data.created_at) : null,
        message: data.message
      };
    }

  } catch (error) {
    console.error(`Payment verification error with ${provider}:`, error);
    return { success: false, message: error.message };
  }
};

// Activate subscription after successful payment
const activateSubscription = async (subscriptionId) => {
  try {
    const subscription = await Subscriptions.findByPk(subscriptionId);
    if (subscription) {
      await subscription.update({ status: 'active' });
      
      // Update user type to premium
      await Users.update(
        { userType: 'premium' },
        { where: { id: subscription.userId } }
      );
    }
  } catch (error) {
    console.error("Activate Subscription Error:", error);
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payments.findByPk(paymentId, {
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Subscriptions,
          as: 'subscription',
          attributes: ['id', 'planType', 'status']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error("Get Payment By ID Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user payment history
const getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = { userId };
    if (status) whereClause.status = status;

    const { count, rows: payments } = await Payments.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Subscriptions,
          as: 'subscription',
          attributes: ['id', 'planType', 'billingCycle']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalPayments: count,
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Get User Payments Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all payments (Admin function)
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, paymentProvider, startDate, endDate } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (status) whereClause.status = status;
    if (paymentProvider) whereClause.paymentProvider = paymentProvider;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows: payments } = await Payments.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Subscriptions,
          as: 'subscription',
          attributes: ['id', 'planType']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate total revenue
    const totalRevenue = await Payments.sum('amount', {
      where: { status: 'successful' }
    });

    res.status(200).json({
      success: true,
      data: payments,
      summary: {
        totalRevenue: totalRevenue || 0,
        successfulPayments: await Payments.count({ where: { status: 'successful' } }),
        pendingPayments: await Payments.count({ where: { status: 'pending' } }),
        failedPayments: await Payments.count({ where: { status: 'failed' } })
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalPayments: count
      }
    });

  } catch (error) {
    console.error("Get All Payments Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, notes } = req.body;

    if (!status || !['pending', 'successful', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required: pending, successful, failed, refunded"
      });
    }

    const payment = await Payments.findByPk(paymentId, {
      include: [
        {
          model: Subscriptions,
          as: 'subscription'
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const previousStatus = payment.status;

    // Update payment
    await payment.update({
      status,
      paidAt: status === 'successful' ? new Date() : payment.paidAt
    });

    // Handle subscription activation/refund
    if (status === 'successful' && payment.subscriptionId && previousStatus !== 'successful') {
      await activateSubscription(payment.subscriptionId);
    } else if (status === 'refunded' && payment.subscriptionId) {
      // Deactivate subscription on refund
      await Subscriptions.update(
        { status: 'cancelled' },
        { where: { id: payment.subscriptionId } }
      );
      
      // Revert user type
      await Users.update(
        { userType: 'client' },
        { where: { id: payment.userId } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: payment
    });

  } catch (error) {
    console.error("Update Payment Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Process refund
const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payments.findByPk(paymentId, {
      include: [
        {
          model: Subscriptions,
          as: 'subscription'
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.status !== 'successful') {
      return res.status(400).json({
        success: false,
        message: "Only successful payments can be refunded"
      });
    }

    // Process refund with payment provider
    const refundResult = await processRefundWithProvider(payment.paymentRef, payment.paymentProvider);
    
    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: `Refund failed: ${refundResult.message}`
      });
    }

    // Update payment status
    await payment.update({
      status: 'refunded'
    });

    // Deactivate subscription if exists
    if (payment.subscriptionId) {
      await Subscriptions.update(
        { status: 'cancelled' },
        { where: { id: payment.subscriptionId } }
      );
      
      // Revert user type
      await Users.update(
        { userType: 'client' },
        { where: { id: payment.userId } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: {
        payment,
        refundReference: refundResult.refundId
      }
    });

  } catch (error) {
    console.error("Process Refund Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Process refund with provider (mock implementation)
const processRefundWithProvider = async (paymentRef, provider) => {
  try {
    // This would integrate with actual payment provider refund API
    // For now, return mock success
    return {
      success: true,
      refundId: `ref_${Date.now()}`,
      message: "Refund processed successfully"
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Get payment statistics
const getPaymentStatistics = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Total revenue for period
    const totalRevenue = await Payments.sum('amount', {
      where: {
        status: 'successful',
        createdAt: { [Op.gte]: startDate }
      }
    });

    // Payment counts by status
    const paymentCounts = await Payments.findAll({
      attributes: [
        'status',
        [Payments.sequelize.fn('COUNT', Payments.sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      group: ['status']
    });

    // Revenue by payment provider
    const revenueByProvider = await Payments.findAll({
      attributes: [
        'paymentProvider',
        [Payments.sequelize.fn('SUM', Payments.sequelize.col('amount')), 'revenue']
      ],
      where: {
        status: 'successful',
        createdAt: { [Op.gte]: startDate }
      },
      group: ['paymentProvider']
    });

    // Recent payments
    const recentPayments = await Payments.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        totalRevenue: totalRevenue || 0,
        paymentCounts,
        revenueByProvider,
        recentPayments,
        startDate,
        endDate: new Date()
      }
    });

  } catch (error) {
    console.error("Get Payment Statistics Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Webhook handler for payment providers
const handlePaymentWebhook = async (req, res) => {
  try {
    const { provider } = req.params;
    const webhookData = req.body;

    if (!PAYMENT_PROVIDERS[provider]) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment provider"
      });
    }

    // Verify webhook signature (implementation depends on provider)
    const isValidWebhook = await verifyWebhookSignature(provider, req);
    
    if (!isValidWebhook) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature"
      });
    }

    // Process webhook based on provider
    let paymentRef, status, amount;

    if (provider === 'Paystack') {
      paymentRef = webhookData.data.reference;
      status = webhookData.data.status;
      amount = webhookData.data.amount / 100;
    } else if (provider === 'Flutterwave') {
      paymentRef = webhookData.data.tx_ref;
      status = webhookData.data.status;
      amount = webhookData.data.amount;
    }

    // Update payment status
    if (paymentRef) {
      const payment = await Payments.findOne({ where: { paymentRef } });
      
      if (payment) {
        const newStatus = status === 'success' ? 'successful' : 'failed';
        await payment.update({
          status: newStatus,
          paidAt: newStatus === 'successful' ? new Date() : null
        });

        // Activate subscription if payment successful
        if (newStatus === 'successful' && payment.subscriptionId) {
          await activateSubscription(payment.subscriptionId);
        }
      }
    }

    res.status(200).json({ success: true, message: "Webhook processed" });

  } catch (error) {
    console.error("Payment Webhook Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify webhook signature (mock implementation)
const verifyWebhookSignature = async (provider, req) => {
  // This would verify the webhook signature with the payment provider
  // For now, return true for development
  return true;
};

module.exports = {
  createPayment,
  getPaymentById,
  getUserPayments,
  getAllPayments,
  updatePaymentStatus,
  processRefund,
  getPaymentStatistics,
  handlePaymentWebhook,
};