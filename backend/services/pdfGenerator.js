/**
 * @desc Generate valid standard-compliant PDF document stream buffer from headers and rows
 */
const generatePDF = (title, headers, rows) => {
  // Escape PDF text string special characters
  const escapePDFText = (text) => {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  };

  // Build the text stream content
  let streamContent = "BT\n/F1 12 Tf\n15 TL\n50 780 Td\n";
  streamContent += `(${escapePDFText(title)}) Tj T*\n`;
  streamContent += "T*\n"; // blank spacer line
  streamContent += `(${escapePDFText(headers.join("  |  "))}) Tj T*\n`;
  streamContent += "T*\n"; // blank spacer line
  
  rows.forEach((row, index) => {
    streamContent += `(${escapePDFText(`Row #${index + 1}: ${row.join("  |  ")}`)}) Tj T*\n`;
  });
  
  streamContent += "ET";

  // Build PDF document objects list
  const objects = [];
  
  // Object 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  
  // Object 2: Pages
  objects.push("2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n");
  
  // Object 3: Page Definition
  objects.push("3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [ 0 0 595 842 ] /Contents 4 0 R >>\nendobj\n");
  
  // Object 4: Contents Stream
  const streamLength = Buffer.byteLength(streamContent, "utf-8");
  objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`);

  // Assemble final PDF content and calculate precise byte offsets
  const pdfHeader = "%PDF-1.4\n";
  let body = pdfHeader;
  const offsets = [];
  let currentOffset = Buffer.byteLength(pdfHeader, "utf-8");
  
  for (let i = 0; i < objects.length; i++) {
    offsets.push(currentOffset);
    body += objects[i];
    currentOffset += Buffer.byteLength(objects[i], "utf-8");
  }

  // Build Xref table
  let xref = "xref\n";
  xref += `0 ${objects.length + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 0; i < offsets.length; i++) {
    const paddedOffset = String(offsets[i]).padStart(10, "0");
    xref += `${paddedOffset} 00000 n \n`;
  }

  const startxref = currentOffset;
  let trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  trailer += `startxref\n${startxref}\n%%EOF`;

  const finalBuffer = Buffer.concat([
    Buffer.from(body, "utf-8"),
    Buffer.from(xref, "utf-8"),
    Buffer.from(trailer, "utf-8")
  ]);

  return finalBuffer;
};

module.exports = { generatePDF };
