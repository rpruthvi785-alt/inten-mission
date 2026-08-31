/**
 * Centralized Matching Rules & Tolerances Configuration
 * Reads configuration from environment variables with sensible defaults.
 */

const matchingConfig = {
  // Quantity tolerance: allowed unit excess over PO/GRN before triggering hard mismatch (default: 2)
  quantityTolerance: parseInt(process.env.QTY_TOLERANCE || process.env.MATCH_QUANTITY_TOLERANCE || '2', 10),

  // MRP tolerance percentage (1.0 = 1% variance threshold)
  mrpTolerancePercent: parseFloat(process.env.MRP_TOLERANCE_PERCENT || process.env.MATCH_MRP_TOLERANCE_PERCENT || '1.0'),

  // Price tolerance default (0.05 = 5% variance threshold)
  priceToleranceDefault: parseFloat(process.env.PRICE_TOLERANCE_DEFAULT || process.env.MATCH_PRICE_TOLERANCE_DEFAULT || '0.05'),

  // Invoice date vs PO date validation
  // In standard procurement, PO Date <= Invoice Date is the normal expected chronological flow.
  // Set to true to allow standard chronological flow (Invoice on or after PO date).
  invoiceDateAfterPoAllowed: process.env.INVOICE_DATE_AFTER_PO_ALLOWED !== 'false',

  // Flag if invoice date is issued before PO date (pre-dating error: Invoice Date < PO Date)
  flagInvoiceBeforePoDate: process.env.FLAG_INVOICE_BEFORE_PO_DATE === 'true',
};

module.exports = matchingConfig;
