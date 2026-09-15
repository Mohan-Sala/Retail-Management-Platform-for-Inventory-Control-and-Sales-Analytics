const CustomerClassification = require("../models/CustomerClassification");
const Order = require("../models/Order");
const User = require("../models/User");
const SystemAudit = require("../models/SystemAudit");

/**
 * @desc Calculate dynamic customer retention metrics from order histories
 */
const calculateRetentionMetrics = async (customerId) => {
  const user = await User.findById(customerId);
  if (!user) return null;

  const orders = await Order.find({ customerId, orderStatus: "delivered" }).lean();
  const customerLifetimeValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const purchaseFrequency = orders.length;
  const averageOrderValue = purchaseFrequency > 0 ? parseFloat((customerLifetimeValue / purchaseFrequency).toFixed(2)) : 0;

  let lastPurchaseDaysAgo = 999;
  if (orders.length > 0) {
    const lastOrder = orders.reduce((latest, o) => {
      return new Date(o.createdAt) > new Date(latest.createdAt) ? o : latest;
    }, orders[0]);
    const diffTime = Math.abs(Date.now() - new Date(lastOrder.createdAt).getTime());
    lastPurchaseDaysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } else {
    const diffTime = Math.abs(Date.now() - new Date(user.createdAt).getTime());
    lastPurchaseDaysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Churn Risk calculation rules
  let churnRiskScore = 10;
  if (purchaseFrequency === 0) {
    churnRiskScore = lastPurchaseDaysAgo > 30 ? 80 : 30;
  } else {
    if (lastPurchaseDaysAgo > 90) churnRiskScore = 95;
    else if (lastPurchaseDaysAgo > 60) churnRiskScore = 75;
    else if (lastPurchaseDaysAgo > 30) churnRiskScore = 45;
  }

  const retentionScore = 100 - churnRiskScore;

  // Sync to CustomerClassification documents
  await CustomerClassification.updateMany(
    { customerId },
    {
      customerLifetimeValue,
      averageOrderValue,
      purchaseFrequency,
      lastPurchaseDaysAgo,
      retentionScore,
      churnRiskScore,
    }
  );

  await SystemAudit.create({
    userId: customerId,
    action: "CUSTOMER_RETENTION_UPDATED",
    details: `Retention metrics calculated. LTV: ${customerLifetimeValue}, Churn Risk: ${churnRiskScore}%`,
    timestamp: new Date(),
  });

  return {
    customerLifetimeValue,
    averageOrderValue,
    purchaseFrequency,
    lastPurchaseDaysAgo,
    retentionScore,
    churnRiskScore,
  };
};

module.exports = {
  calculateRetentionMetrics,
};
