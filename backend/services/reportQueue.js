const Report = require("../models/Report");
const ReportStorageService = require("./ReportStorageService");
const csvGenerator = require("./csvGenerator");
const excelGenerator = require("./excelGenerator");
const pdfGenerator = require("./pdfGenerator");

const productService = require("./productService");
const vendorService = require("./vendorService");
const customerService = require("./customerService");
const transactionService = require("./transactionService");
const dashboardAnalyticsService = require("./dashboardAnalyticsService");

const MAX_RETRIES = 3;

/**
 * @desc Gather and construct raw data sets matching type
 */
const compileReportData = async (report) => {
  const { type, filters } = report;
  let headers = [];
  let rows = [];

  const limit = filters.limit || 5000;
  const options = { limit };
  if (filters.vendorId) options.vendorId = filters.vendorId;

  if (type === "custom_export") {
    headers = filters.headers || [];
    rows = filters.rows || [];
  }
  else if (type === "product") {
    headers = ["Product Name", "SKU", "Category", "Price", "Stock", "Status"];
    const res = await productService.getAllProducts(options);
    const list = res.products || [];
    rows = list.map(p => [p.name, p.sku, p.category, `₹${p.price}`, String(p.stock), p.status]);
  } 
  else if (type === "vendor") {
    headers = ["Business Name", "Owner Name", "Email", "Phone", "Status", "Revenue"];
    const res = await vendorService.getAllVendors(options);
    const list = res.vendors || [];
    rows = list.map(v => [v.businessName, v.ownerName, v.email, v.phone, v.status, `₹${v.revenue || 0}`]);
  }
  else if (type === "customer") {
    headers = ["Name", "Email", "Phone", "City", "Category Tier", "Total Spending", "Total Orders"];
    const res = await customerService.getCustomers(options);
    const list = res.data?.customers || [];
    rows = list.map(c => [c.name, c.email, c.phone, c.city, c.customerCategory, `₹${c.totalSpending || 0}`, String(c.totalOrders || 0)]);
  }
  else if (type === "transaction" || type === "sales") {
    headers = ["Order No", "Customer", "Product Name", "Qty", "Amount", "Payment Method", "Status", "Date"];
    const res = await transactionService.getAllTransactions(options);
    const list = res.transactions || [];
    rows = list.map(t => [t.orderNo, t.customer, t.productName, String(t.qty), `₹${t.amount}`, t.paymentMethod, t.status, new Date(t.date).toLocaleDateString()]);
  }
  else {
    headers = ["Metric Category", "Metric Key", "Metric Value"];
    const analytics = await dashboardAnalyticsService.getDashboardAnalytics(options);
    
    rows = [
      ["Executive Summary", "Total Revenue", `₹${analytics.summary?.totalRevenue || 0}`],
      ["Executive Summary", "Total Transactions", String(analytics.summary?.totalTransactions || 0)],
      ["Executive Summary", "Total Products", String(analytics.summary?.totalProducts || 0)],
      ["Executive Summary", "Out Of Stock Items", String(analytics.summary?.outOfStockItems || 0)],
      ["Executive Summary", "Low Stock Items", String(analytics.summary?.lowStockItems || 0)],
      ["Executive Summary", "Average Order Value", `₹${analytics.summary?.averageOrderValue || 0}`],
      ["Forecast", "Forecast Demand Units", String(analytics.summary?.forecastDemand || 0)],
    ];
  }

  // Row limits protection
  const maxRows = Number(process.env.REPORT_MAX_ROW_LIMIT) || 10000;
  if (rows.length > maxRows) {
    rows = rows.slice(0, maxRows);
  }

  return { headers, rows };
};

/**
 * @desc Process a single queued report job asynchronously
 */
const processReportJob = async (reportId) => {
  let report = await Report.findById(reportId);
  if (!report || report.status !== "queued") return;

  report.status = "processing";
  report.progress = 10;
  await report.save();

  try {
    const { headers, rows } = await compileReportData(report);
    report.progress = 50;
    await report.save();

    let buffer;
    const filename = `report_${report._id}_v${report.version}.${report.format}`;

    if (report.format === "pdf") {
      buffer = pdfGenerator.generatePDF(report.title, headers, rows);
    } else if (report.format === "xlsx") {
      buffer = excelGenerator.generateExcel(report.title, headers, rows);
    } else {
      buffer = csvGenerator.generateCSV(headers, rows);
    }

    report.progress = 80;
    await report.save();

    const storageRes = await ReportStorageService.saveFile(filename, buffer);

    report.status = "completed";
    report.progress = 100;
    report.fileUrl = storageRes.fileUrl;
    report.fileSize = storageRes.fileSize;
    report.checksum = storageRes.checksum;
    report.storageProvider = storageRes.storageProvider;
    report.completedAt = new Date();
    
    const retentionDays = Number(process.env.REPORT_RETENTION_DAYS) || 30;
    report.expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
    
    await report.save();
    console.log(`[Report Worker] Job #${reportId} completed successfully.`);
  } catch (err) {
    console.error(`[Report Worker] Job #${reportId} failed:`, err);
    
    const attemptCount = (report.errorMessage ? parseInt(report.errorMessage.match(/\d+/)?.[0] || "0") : 0) + 1;
    
    if (attemptCount <= MAX_RETRIES) {
      report.status = "queued";
      report.errorMessage = `Retry attempt #${attemptCount} failed: ${err.message}`;
      await report.save();
      
      const retryDelay = Math.pow(2, attemptCount) * 1000;
      setTimeout(() => {
        processReportJob(reportId);
      }, retryDelay);
    } else {
      report.status = "failed";
      report.errorMessage = err.message;
      report.failedAt = new Date();
      await report.save();
    }
  }
};

/**
 * @desc Queue job submission helper (avoids duplicates)
 */
const addJobToQueue = async (reportData) => {
  const { title, type, format, filters, creatorId, previousVersionId, version } = reportData;

  const duplicate = await Report.findOne({
    status: { $in: ["queued", "processing"] },
    type,
    format,
    creatorId,
    filters,
  });

  if (duplicate) {
    console.log(`[Report Queue] Found duplicate active job #${duplicate._id}. Reusing.`);
    return duplicate;
  }

  const report = await Report.create({
    title,
    type,
    format,
    filters,
    creatorId,
    previousVersionId,
    version,
  });

  processReportJob(report._id);

  return report;
};

module.exports = {
  addJobToQueue,
  processReportJob,
};
