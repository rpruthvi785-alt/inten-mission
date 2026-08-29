/**
 * Centralized Data Normalization Utility
 * Normalizes dates, quantities, rates, MRPs, and SKU codes across PO, GRN, and Invoices.
 */

/**
 * Robust Date Normalizer
 * Supports:
 * - DD/MM/YYYY, DD-MM-YYYY
 * - YYYY-MM-DD, YYYY/MM/DD
 * - "Mar 17, 2026", "17-3-2026", "24/03/2026"
 * - ISO-8601 strings, Date objects, Timestamps
 */
function parseNormalizedDate(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }

  const str = String(val).trim();
  if (!str) return null;

  // Check if DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d;
  }

  // Check if YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d;
  }

  // Standard Date parse fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

/**
 * Numeric Normalizer
 * Handles: "1,000", "1000.00", "₹100", "50 units", null, undefined
 */
function normalizeNumeric(val, fallback = 0) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : val;
  }

  // Strip currency symbols (₹, $, €), commas, and text
  const clean = String(val).replace(/[₹\$,\s]/g, '').replace(/[^\d.-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? fallback : num;
}

/**
 * Calculate difference in whole days between two dates
 */
function getDateDiffDays(d1, d2) {
  const date1 = parseNormalizedDate(d1);
  const date2 = parseNormalizedDate(d2);
  if (!date1 || !date2) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round((utc2 - utc1) / msPerDay);
}

module.exports = {
  parseNormalizedDate,
  normalizeNumeric,
  getDateDiffDays,
};
