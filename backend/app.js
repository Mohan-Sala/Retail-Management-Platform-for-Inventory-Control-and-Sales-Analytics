const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const errorHandler = require("./middleware/errorHandler");
const ApiError = require("./utils/ApiError");
const ApiResponse = require("./utils/ApiResponse");
let swaggerDocument;
try {
  swaggerDocument = require("./swagger.json");
} catch (e) {
  swaggerDocument = { openapi: "3.0.0", info: { title: "ShopSense API", version: "1.0.0" }, paths: {} };
}
const app = express();
const { auditLogger, maintenanceGuard } = require("./middleware/auditMiddleware");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(auditLogger);
app.use(maintenanceGuard);
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api/health", (req, res) => {
  res.status(200).json(new ApiResponse(200, { uptime: process.uptime(), timestamp: Date.now() }, "Backend is healthy and running."));
});
const authRoutes = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const productRoutes = require("./routes/productRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const forecastRoutes = require("./routes/forecastRoutes");
const customerRoutes = require("./routes/customerRoutes");
const customerAnalyticsRoutes = require("./routes/customerAnalyticsRoutes");
const customerSegmentationRoutes = require("./routes/customerSegmentationRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const dashboardAnalyticsRoutes = require("./routes/dashboardAnalyticsRoutes");
const aiRoutes = require("./routes/aiRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const businessIntelligenceRoutes = require("./routes/businessIntelligenceRoutes");

const businessInsightsRoutes = require("./routes/businessInsightsRoutes");
const systemAdministrationRoutes = require("./routes/systemAdministrationRoutes");
const userRoutes = require("./routes/userRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const profileRoutes = require("./routes/profileRoutes");
const searchRoutes = require("./routes/searchRoutes");
const exportRoutes = require("./routes/exportRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const marketplaceRoutes = require("./routes/marketplaceRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const customerInsightsRoutes = require("./routes/customerInsightsRoutes");
const couponRoutes = require("./routes/couponRoutes");
const loyaltyRoutes = require("./routes/loyaltyRoutes");
const returnRoutes = require("./routes/returnRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const supportRoutes = require("./routes/supportRoutes");
const customerBehaviorRoutes = require("./routes/customerBehaviorRoutes");
const customerSegmentsRoutes = require("./routes/customerSegmentsRoutes");
const customerRetentionRoutes = require("./routes/customerRetentionRoutes");

// Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/forecast", forecastRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customer-analytics", customerAnalyticsRoutes);
app.use("/api/customer-segmentation", customerSegmentationRoutes);
app.use("/api/recommendation", recommendationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/dashboard-analytics", dashboardAnalyticsRoutes);
app.use("/api/chat", aiRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/business-intelligence", businessIntelligenceRoutes);
app.use("/api/business-insights", businessInsightsRoutes);
app.use("/api/system", systemAdministrationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/customer-insights", customerInsightsRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/customer-behavior", customerBehaviorRoutes);
app.use("/api/customer-segments", customerSegmentsRoutes);
app.use("/api/customer-retention", customerRetentionRoutes);

// Catch-all 404 Route Not Found
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
