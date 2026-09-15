const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
const Report = require("../models/Report");
const BusinessInsight = require("../models/BusinessInsight");
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * @desc Highlight the query match in string
 */
const highlight = (text, query) => {
  if (!text) return "";
  const str = String(text);
  const index = str.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return str.slice(0, 60);
  const start = Math.max(0, index - 20);
  const end = Math.min(str.length, index + query.length + 30);
  const slice = str.slice(start, end);
  const matched = str.slice(index, index + query.length);
  return (start > 0 ? "..." : "") + slice.replace(new RegExp(query, "i"), `<strong>${matched}</strong>`) + (end < str.length ? "..." : "");
};

/**
 * @desc Performs concurrent searches across Mongoose collections with role filters
 */
const performSearch = async (user, q, limit = 5) => {
  if (!q) return {};

  const queryRegex = new RegExp(q, "i");
  const results = {};
  const searchPromises = [];

  // 1. Products (Vendor scoped)
  const productQuery = { deletedAt: null, name: queryRegex };
  if (user.role === "vendor") {
    productQuery.vendorId = user._id;
  }
  searchPromises.push(
    Product.find(productQuery).limit(limit).lean().then((items) => {
      if (items.length > 0) {
        results.products = items.map((item) => ({
          id: item._id,
          title: item.name,
          subtitle: `Category: ${item.category} | Price: $${item.price}`,
          highlight: highlight(item.name, q),
          link: `/admin/products`,
        }));
      }
    }),
  );

  // 2. Customers (Admin/Manager/Staff only)
  if (["admin", "manager", "staff"].includes(user.role)) {
    searchPromises.push(
      Customer.find({ name: queryRegex }).limit(limit).lean().then((items) => {
        if (items.length > 0) {
          results.customers = items.map((item) => ({
            id: item._id,
            title: item.name,
            subtitle: `Email: ${item.email} | Phone: ${item.phone || "N/A"}`,
            highlight: highlight(item.name, q),
            link: `/admin/customers`,
          }));
        }
      }),
    );
  }

  // 3. Vendors (Admin/Manager/Staff only)
  if (["admin", "manager", "staff"].includes(user.role)) {
    searchPromises.push(
      Vendor.find({ name: queryRegex }).limit(limit).lean().then((items) => {
        if (items.length > 0) {
          results.vendors = items.map((item) => ({
            id: item._id,
            title: item.name,
            subtitle: `Contact: ${item.email} | Category: ${item.category}`,
            highlight: highlight(item.name, q),
            link: `/admin/vendors`,
          }));
        }
      }),
    );
  }

  // 4. Transactions (Vendor scoped)
  const transactionQuery = {
    $or: [
      { invoiceNumber: queryRegex },
      { customerName: queryRegex },
    ],
  };
  if (user.role === "vendor") {
    transactionQuery.vendorId = user._id;
  }
  searchPromises.push(
    Transaction.find(transactionQuery).limit(limit).lean().then((items) => {
      if (items.length > 0) {
        results.transactions = items.map((item) => ({
          id: item._id,
          title: `Invoice #${item.invoiceNumber}`,
          subtitle: `Customer: ${item.customerName} | Total: $${item.totalAmount}`,
          highlight: highlight(item.customerName || item.invoiceNumber, q),
          link: `/admin/transactions`,
        }));
      }
    }),
  );

  // 5. Reports
  const reportQuery = { name: queryRegex };
  if (user.role === "vendor") {
    reportQuery.createdBy = user.name;
  }
  searchPromises.push(
    Report.find(reportQuery).limit(limit).lean().then((items) => {
      if (items.length > 0) {
        results.reports = items.map((item) => ({
          id: item._id,
          title: item.name,
          subtitle: `Type: ${item.type} | Format: ${item.format}`,
          highlight: highlight(item.name, q),
          link: `/admin/reports`,
        }));
      }
    }),
  );

  // 6. Business Insights
  searchPromises.push(
    BusinessInsight.find({ title: queryRegex }).limit(limit).lean().then((items) => {
      if (items.length > 0) {
        results.businessInsights = items.map((item) => ({
          id: item._id,
          title: item.title,
          subtitle: `Category: ${item.category} | Impact: ${item.impact}`,
          highlight: highlight(item.title, q),
          link: `/admin/business-insights`,
        }));
      }
    }),
  );

  // 7. Notifications
  const notificationQuery = { userId: user._id, title: queryRegex };
  searchPromises.push(
    Notification.find(notificationQuery).limit(limit).lean().then((items) => {
      if (items.length > 0) {
        results.notifications = items.map((item) => ({
          id: item._id,
          title: item.title,
          subtitle: `Priority: ${item.priority} | Read: ${item.isRead ? "Yes" : "No"}`,
          highlight: highlight(item.title, q),
          link: `/admin/notifications`,
        }));
      }
    }),
  );

  // 8. Users (Admin only)
  if (user.role === "admin") {
    searchPromises.push(
      User.find({ name: queryRegex, deletedAt: null }).limit(limit).lean().then((items) => {
        if (items.length > 0) {
          results.users = items.map((item) => ({
            id: item._id,
            title: item.name,
            subtitle: `Email: ${item.email} | Role: ${item.role}`,
            highlight: highlight(item.name, q),
            link: `/admin/users`,
          }));
        }
      }),
    );
  }

  await Promise.all(searchPromises);
  return results;
};

module.exports = { performSearch };
