/**
 * @desc Protect values against CSV/Excel Formula Injection attacks
 */
const sanitizeFormula = (val) => {
  if (val === null || val === undefined) return "";
  let str = String(val);
  if (/^[=\+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
};

/**
 * @desc Generate CSV file buffer from headers and rows
 */
const generateCSV = (headers, rows) => {
  const csvRows = [];
  
  // Clean headers
  csvRows.push(headers.map(h => `"${sanitizeFormula(h)}"`).join(","));

  // Clean data rows
  rows.forEach(row => {
    csvRows.push(row.map(val => `"${sanitizeFormula(val)}"`).join(","));
  });

  return Buffer.from(csvRows.join("\n"), "utf-8");
};

module.exports = { generateCSV };
