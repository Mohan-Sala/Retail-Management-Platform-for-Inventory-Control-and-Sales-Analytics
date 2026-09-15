const Invoice = require("../models/Invoice");
const Order = require("../models/Order");
const User = require("../models/User");
const Notification = require("../models/Notification");
const SystemAudit = require("../models/SystemAudit");
const ApiError = require("../utils/ApiError");

/**
 * @desc Generate an immutable billing invoice snapshot for a completed order payment
 */
const generateInvoice = async (orderId, session = null) => {
  const order = await Order.findById(orderId).session(session);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const existingInvoice = await Invoice.findOne({ orderId }).session(session);
  if (existingInvoice) {
    return existingInvoice;
  }

  const customer = await User.findById(order.customerId).session(session);
  const vendor = await User.findById(order.vendorId).session(session);

  const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100000 + Math.random() * 900000)}`;

  const invoiceSnapshot = {
    orderNumber: order.orderNumber,
    customerName: customer ? customer.name : "Guest Customer",
    customerEmail: customer ? customer.email : "",
    vendorName: vendor ? (vendor.businessName || vendor.name) : "ShopSense Partner",
    vendorEmail: vendor ? vendor.email : "",
    items: order.items,
    shippingAddress: order.shippingAddress,
    subtotal: order.subtotal,
    tax: order.tax,
    discount: order.discount,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    couponCode: order.couponCode,
    loyaltyPointsRedeemed: order.loyaltyPointsRedeemed,
    loyaltyPointsEarned: order.loyaltyPointsEarned,
  };

  const invoice = new Invoice({
    invoiceNumber,
    orderId: order._id,
    customerId: order.customerId,
    vendorId: order.vendorId,
    invoiceSnapshot,
    subtotal: order.subtotal,
    tax: order.tax,
    discount: order.discount,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    taxBreakdown: {
      gst: parseFloat((order.tax * 0.7).toFixed(2)),
      vat: parseFloat((order.tax * 0.3).toFixed(2)),
      salesTax: 0,
    },
    couponApplied: {
      code: order.couponCode || "",
      discount: order.discountBreakdown?.couponDiscount || 0,
    },
    loyaltyPointsEarned: order.loyaltyPointsEarned || 0,
    loyaltyPointsRedeemed: order.loyaltyPointsRedeemed || 0,
    invoiceVersion: 1,
    generatedAt: new Date(),
  });

  await invoice.save({ session });

  await Notification.create([{
    userId: order.customerId,
    title: "Invoice Generated",
    message: `Your invoice ${invoiceNumber} for order ${order.orderNumber} is ready for download.`,
    type: "billing",
  }], { session });

  await SystemAudit.create([{
    userId: order.customerId,
    action: "INVOICE_GENERATED",
    details: `Invoice ${invoiceNumber} generated for order ${order.orderNumber}`,
    timestamp: new Date(),
  }], { session });

  return invoice;
};

const getInvoices = async (userId, role) => {
  const filter = {};
  if (role === "customer") {
    filter.customerId = userId;
  } else if (role === "vendor") {
    filter.vendorId = userId;
  }
  return Invoice.find(filter).sort({ createdAt: -1 }).lean();
};

const getInvoiceHtml = (invoice) => {
  const snapshot = invoice.invoiceSnapshot;
  const itemsRows = snapshot.items.map((item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.snapshot?.productName || "Product Item"}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.subtotal}</td>
    </tr>
  `).join("");

  return `
    <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: sans-serif; color: #333; margin: 40px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .details { margin: 20px 0; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f5f5f5; padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
          .totals { margin-top: 30px; text-align: right; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2>SHOPSENSE INVOICE</h2>
            <p>Invoice #: <strong>${invoice.invoiceNumber}</strong></p>
            <p>Date: ${new Date(invoice.generatedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div class="details">
          <div>
            <strong>Billing To:</strong>
            <p>${snapshot.customerName}</p>
            <p>${snapshot.customerEmail}</p>
            <p>${snapshot.shippingAddress?.addressLine1}, ${snapshot.shippingAddress?.city}</p>
          </div>
          <div>
            <strong>Sold By:</strong>
            <p>${snapshot.vendorName}</p>
            <p>${snapshot.vendorEmail}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        <div class="totals">
          <p>Subtotal: <strong>₹${invoice.subtotal}</strong></p>
          <p>Tax: <strong>₹${invoice.tax}</strong></p>
          <p>Discount: <strong>-₹${invoice.discount}</strong></p>
          <hr />
          <h3>Total Paid: ₹${invoice.totalAmount}</h3>
        </div>
      </body>
    </html>
  `;
};

module.exports = {
  generateInvoice,
  getInvoices,
  getInvoiceHtml,
};
