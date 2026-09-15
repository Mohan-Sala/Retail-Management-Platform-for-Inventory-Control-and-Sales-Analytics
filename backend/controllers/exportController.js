const reportQueue = require("../services/reportQueue");
const csvGenerator = require("../services/csvGenerator");
const excelGenerator = require("../services/excelGenerator");
const pdfGenerator = require("../services/pdfGenerator");
const ApiError = require("../utils/ApiError");

/**
 * @desc Handles CSV/Excel/PDF exports, streaming small payloads immediately and enqueuing larger requests
 */
const exportData = async (req, res, next) => {
  try {
    const { title, format, headers, rows } = req.body;

    if (!format || !headers || !rows) {
      throw new ApiError(400, "Missing required export parameters (format, headers, rows)");
    }

    const fileFormat = format === "excel" ? "xlsx" : format;
    if (!["csv", "xlsx", "pdf"].includes(fileFormat)) {
      throw new ApiError(400, `Unsupported export format: ${format}`);
    }

    if (rows.length <= 100) {
      console.log(`[Export] Processing small export synchronously (${rows.length} rows)`);
      let buffer;
      let contentType;
      const fileExt = fileFormat;

      if (fileFormat === "pdf") {
        buffer = pdfGenerator.generatePDF(title || "Export", headers, rows);
        contentType = "application/pdf";
      } else if (fileFormat === "xlsx") {
        buffer = excelGenerator.generateExcel(title || "Export", headers, rows);
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else {
        buffer = csvGenerator.generateCSV(headers, rows);
        contentType = "text/csv";
      }

      res.setHeader("Content-Disposition", `attachment; filename="export_${Date.now()}.${fileExt}"`);
      res.setHeader("Content-Type", contentType);
      return res.send(buffer);
    } else {
      console.log(`[Export] Enqueuing large export asynchronously (${rows.length} rows)`);
      const job = await reportQueue.addJobToQueue({
        title: title || "Custom Export",
        type: "custom_export",
        format: fileFormat,
        filters: { headers, rows },
        creatorId: req.user._id,
        version: 1,
      });

      return res.status(202).json({
        success: true,
        async: true,
        jobId: job._id,
        status: job.status,
        progress: job.progress,
        message: "Large export task successfully queued.",
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { exportData };
