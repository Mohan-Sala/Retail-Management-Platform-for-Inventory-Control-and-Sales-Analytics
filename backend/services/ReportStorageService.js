const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const localDir = process.env.REPORT_LOCAL_DIR || "uploads/reports";
const fullLocalPath = path.resolve(__dirname, "../../", localDir);

// Ensure local storage directory exists
if (!fs.existsSync(fullLocalPath)) {
  fs.mkdirSync(fullLocalPath, { recursive: true });
}

/**
 * @desc Calculate SHA-256 hash checksum of a buffer
 */
const getChecksum = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

/**
 * @desc Save report output binary to disk
 */
const saveFile = async (filename, buffer) => {
  const provider = process.env.REPORT_STORAGE_PROVIDER || "local";
  const checksum = getChecksum(buffer);
  const fileSize = buffer.length;

  if (provider === "local") {
    const filePath = path.join(fullLocalPath, filename);
    await fs.promises.writeFile(filePath, buffer);
    const fileUrl = `${localDir}/${filename}`;
    
    return {
      storageProvider: "local",
      fileUrl,
      fileSize,
      checksum,
    };
  } else {
    // S3, GCS, Azure driver mocks. Falls back to local filesystem securely.
    const filePath = path.join(fullLocalPath, filename);
    await fs.promises.writeFile(filePath, buffer);
    const fileUrl = `${localDir}/${filename}`;
    
    return {
      storageProvider: "local",
      fileUrl,
      fileSize,
      checksum,
    };
  }
};

/**
 * @desc Get file binary buffer from storage
 */
const getFileBuffer = async (fileUrl) => {
  const filePath = path.resolve(__dirname, "../../", fileUrl);
  if (!fs.existsSync(filePath)) {
    throw new Error("Report file not found on storage");
  }
  return await fs.promises.readFile(filePath);
};

/**
 * @desc Delete file from disk
 */
const deleteFile = async (fileUrl) => {
  try {
    const filePath = path.resolve(__dirname, "../../", fileUrl);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error(`[Storage Service] Failed to unlink storage file at ${fileUrl}:`, err);
  }
};

/**
 * @desc Generate secure internal download path
 */
const getSecureDownloadUrl = (reportId) => {
  return `/api/reports/download/${reportId}`;
};

module.exports = {
  saveFile,
  getFileBuffer,
  deleteFile,
  getSecureDownloadUrl,
  getChecksum,
};
