const CustomerClassification = require("../models/CustomerClassification");

const getRank = (amount) => {
  if (amount >= 20000) return "Gold";
  if (amount >= 5000) return "Silver";
  return "Bronze";
};

/**
 * @desc Updates customer total orders, total spent, and rank tier for a specific vendor
 */
const updateClassification = async (customerId, vendorId, amount, session) => {
  let doc = await CustomerClassification.findOne({ customerId, vendorId }).session(session);

  if (!doc) {
    const rank = getRank(amount);
    doc = new CustomerClassification({
      customerId,
      vendorId,
      totalOrders: 1,
      totalSpent: amount,
      lifetimeValue: amount,
      rank,
      firstPurchaseAt: new Date(),
      lastPurchaseAt: new Date(),
    });
  } else {
    const newSpent = doc.totalSpent + amount;
    doc.totalOrders += 1;
    doc.totalSpent = newSpent;
    doc.lifetimeValue = newSpent;
    doc.rank = getRank(newSpent);
    doc.lastPurchaseAt = new Date();
  }

  await doc.save({ session });
  return doc;
};

const getCustomerClassification = async (customerId, vendorId) => {
  return CustomerClassification.findOne({ customerId, vendorId }).lean();
};

module.exports = {
  updateClassification,
  getCustomerClassification,
  getRank,
};
