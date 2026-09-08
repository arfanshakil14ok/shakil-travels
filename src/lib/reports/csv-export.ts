/**
 * Universal CSV Export Utility
 * Implements RFC 4180 compliance, formula injection protection, and UTF-8 BOM
 */

export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value).trim();

  // Defense against CSV injection attacks in spreadsheet programs (Excel, Calc)
  if (str.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(str[0])) {
    str = `'${str}`;
  }

  // Escape double quotes and enclose in quotes if contains comma, quote, or newline
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function generateCsvString(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));

  // Prepend UTF-8 BOM (\uFEFF)
  return `\uFEFF${headerLine}\r\n${rowLines.join('\r\n')}`;
}
