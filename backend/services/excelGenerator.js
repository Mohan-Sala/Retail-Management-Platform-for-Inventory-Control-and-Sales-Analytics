/**
 * @desc Generate Excel workbook buffer from headers and rows
 */
const generateExcel = (title, headers, rows) => {
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
  html += `<head><meta charset="UTF-8"><style>
    th { background-color: #4f46e5; color: white; font-weight: bold; padding: 6px; }
    td { padding: 6px; border: 1px solid #e2e8f0; }
  </style></head><body>`;
  html += `<h2>${title}</h2>`;
  html += `<table><thead><tr>`;
  headers.forEach(h => {
    html += `<th>${h}</th>`;
  });
  html += `</tr></thead><tbody>`;
  rows.forEach(row => {
    html += `<tr>`;
    row.forEach(cell => {
      html += `<td>${cell}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table></body></html>`;
  return Buffer.from(html, "utf-8");
};

module.exports = { generateExcel };
