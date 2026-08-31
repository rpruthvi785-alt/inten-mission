const {
  PurchaseOrder,
  Grn,
  Invoice,
  SkuMaster,
} = require('../models');
const { resolveSku } = require('./sku.service');
const { parseNormalizedDate, normalizeNumeric, getDateDiffDays } = require('../utils/normalizer');
const matchingConfig = require('../config/matchingRules.config');

/**
 * Perform dynamic Three-Way Match computation for a given PO number
 * Uses configurable tolerances for quantity, MRP, and chronological date rules.
 */
async function matchPurchaseOrder(poNumber, customOptions = {}) {
  if (!poNumber) {
    throw new Error('poNumber is required for matching');
  }

  const cleanPoNumber = String(poNumber).trim();
  const config = { ...matchingConfig, ...customOptions };

  // Support both CI4PO05788 (letter O) and CI4P005788 (number 0) and case-insensitive search
  const normalizedPattern = cleanPoNumber.replace(/[0oO]/g, '[0oO]');
  const poQuery = {
    $or: [
      { poNumber: cleanPoNumber },
      { poNumber: { $regex: new RegExp(`^${normalizedPattern}$`, 'i') } }
    ]
  };

  // Load all documents from CURRENT database (never cached)
  const [poDocs, grnDocs, invoiceDocs] = await Promise.all([
    PurchaseOrder.find(poQuery).lean(),
    Grn.find(poQuery).lean(),
    Invoice.find(poQuery).lean(),
  ]);

  const globalReasons = new Set();
  const hardViolations = new Set();
  const softWarnings = new Set();
  const conflictsList = [];
  const warningsList = [];

  const hasPo = poDocs.length > 0;
  const hasGrn = grnDocs.length > 0;
  const hasInvoice = invoiceDocs.length > 0;

  // 1. Duplicate document checks
  if (poDocs.length > 1) {
    globalReasons.add('duplicate_po');
    hardViolations.add('duplicate_po');
    conflictsList.push({
      code: 'duplicate_po',
      title: 'Duplicate Purchase Order',
      description: `Multiple (${poDocs.length}) Purchase Orders found for ${cleanPoNumber}`,
      resolution: 'Remove duplicate record or assign unique PO revision number.',
      details: { poCount: poDocs.length },
    });
  }

  const grnNumberCounts = {};
  for (const g of grnDocs) {
    const num = g.grnNumber || 'UNKNOWN';
    grnNumberCounts[num] = (grnNumberCounts[num] || 0) + 1;
    if (grnNumberCounts[num] > 1) {
      globalReasons.add('duplicate_document');
      hardViolations.add('duplicate_document');
      conflictsList.push({
        code: 'duplicate_document',
        title: 'Duplicate GRN Document',
        description: `Duplicate GRN number detected: ${num}`,
        resolution: 'Verify whether this is a duplicate warehouse submission.',
        details: { documentType: 'GRN', documentNumber: num },
      });
    }
  }

  const invoiceNumberCounts = {};
  for (const inv of invoiceDocs) {
    const num = inv.invoiceNumber || 'UNKNOWN';
    invoiceNumberCounts[num] = (invoiceNumberCounts[num] || 0) + 1;
    if (invoiceNumberCounts[num] > 1) {
      globalReasons.add('duplicate_document');
      hardViolations.add('duplicate_document');
      conflictsList.push({
        code: 'duplicate_document',
        title: 'Duplicate Invoice Document',
        description: `Duplicate invoice number detected: ${num}`,
        resolution: 'Verify whether this is a duplicate submission and avoid double-processing.',
        details: { documentType: 'INVOICE', documentNumber: num },
      });
    }
  }

  // 2. Chronological Date Validation (Configurable)
  let dateFlowInfo = null;
  if (hasPo && hasInvoice) {
    const primaryPo = poDocs[0];
    const poDate = parseNormalizedDate(primaryPo.poDate);

    if (poDate) {
      for (const inv of invoiceDocs) {
        const invDate = parseNormalizedDate(inv.invoiceDate);
        if (invDate) {
          const diffDays = getDateDiffDays(poDate, invDate);

          dateFlowInfo = {
            poDate: poDate.toISOString().split('T')[0],
            invoiceDate: invDate.toISOString().split('T')[0],
            differenceDays: diffDays,
            isValidChronological: diffDays >= 0,
          };

          // If chronological order is strictly configured to disallow Invoice after PO:
          if (!config.invoiceDateAfterPoAllowed && invDate.getTime() > poDate.getTime()) {
            globalReasons.add('invoice_date_after_po_date');
            hardViolations.add('invoice_date_after_po_date');
            conflictsList.push({
              code: 'invoice_date_after_po_date',
              title: 'Invoice Date After PO Date',
              description: `Invoice date (${dateFlowInfo.invoiceDate}) is ${diffDays} day(s) after PO date (${dateFlowInfo.poDate})`,
              resolution: 'Verify document dates with vendor. Request corrected invoice if billing date was entered in error.',
              details: dateFlowInfo,
            });
          }

          // If configured to flag invoices issued BEFORE PO was created:
          if (config.flagInvoiceBeforePoDate && invDate.getTime() < poDate.getTime()) {
            globalReasons.add('invoice_date_before_po_date');
            hardViolations.add('invoice_date_before_po_date');
            conflictsList.push({
              code: 'invoice_date_before_po_date',
              title: 'Invoice Pre-Dates Purchase Order',
              description: `Invoice date (${dateFlowInfo.invoiceDate}) is dated before PO date (${dateFlowInfo.poDate})`,
              resolution: 'Verify why invoice was created prior to PO issuance.',
              details: dateFlowInfo,
            });
          }
        }
      }
    }
  }

  // 3. Line item aggregation map
  // Key: SkuMaster._id (if resolved) or "raw:itemCode"
  const itemMap = new Map();

  async function getOrCreateItemEntry(rawItemCode, existingSkuMasterId = null) {
    let skuMasterDoc = null;
    let matchingKey = '';

    if (existingSkuMasterId) {
      skuMasterDoc = await SkuMaster.findById(existingSkuMasterId).lean();
    }
    if (!skuMasterDoc && rawItemCode) {
      skuMasterDoc = await resolveSku(String(rawItemCode).trim());
    }

    if (skuMasterDoc) {
      matchingKey = String(skuMasterDoc._id);
    } else {
      matchingKey = `raw:${String(rawItemCode || '').trim().toUpperCase()}`;
    }

    if (!itemMap.has(matchingKey)) {
      itemMap.set(matchingKey, {
        key: matchingKey,
        skuMasterId: skuMasterDoc ? skuMasterDoc._id : null,
        sku: skuMasterDoc ? skuMasterDoc.skuErpCode : rawItemCode,
        skuName: skuMasterDoc ? skuMasterDoc.name : '',
        erpCode: skuMasterDoc ? skuMasterDoc.skuErpCode : rawItemCode,
        eanCode: skuMasterDoc ? skuMasterDoc.eanCode : '',
        hsnCode: skuMasterDoc ? skuMasterDoc.hsnCode : '',
        uom: skuMasterDoc ? skuMasterDoc.uom : 'NOS',
        agreedRate: skuMasterDoc && skuMasterDoc.agreedRate !== undefined ? normalizeNumeric(skuMasterDoc.agreedRate, null) : null,
        priceTolerance: skuMasterDoc && skuMasterDoc.priceTolerance !== undefined ? normalizeNumeric(skuMasterDoc.priceTolerance, config.priceToleranceDefault) : config.priceToleranceDefault,
        masterMrp: skuMasterDoc && skuMasterDoc.mrp !== undefined ? normalizeNumeric(skuMasterDoc.mrp, null) : null,
        poQty: 0,
        grnQty: 0,
        invoiceQty: 0,
        invoiceRates: [],
        mrpValues: [],
        descriptions: new Set(),
        presentInPo: false,
        presentInGrn: false,
        presentInInvoice: false,
        reasons: new Set(),
        itemWarnings: [],
      });
    }

    return itemMap.get(matchingKey);
  }

  // 3a. Process PO items
  for (const po of poDocs) {
    for (const item of po.items || []) {
      const entry = await getOrCreateItemEntry(item.itemCode, item.skuMaster);
      entry.poQty += normalizeNumeric(item.quantity, 0);
      entry.presentInPo = true;
      if (item.description) entry.descriptions.add(item.description);
    }
  }

  // 3b. Process GRN items
  for (const grn of grnDocs) {
    for (const item of grn.items || []) {
      const entry = await getOrCreateItemEntry(item.itemCode, item.skuMaster);
      entry.grnQty += normalizeNumeric(item.receivedQuantity ?? item.quantity, 0);
      entry.presentInGrn = true;
      if (item.mrp !== null && item.mrp !== undefined) {
        entry.mrpValues.push(normalizeNumeric(item.mrp));
      }
      if (item.description) entry.descriptions.add(item.description);
    }
  }

  // 3c. Process Invoice items
  for (const inv of invoiceDocs) {
    for (const item of inv.items || []) {
      const entry = await getOrCreateItemEntry(item.itemCode, item.skuMaster);
      entry.invoiceQty += normalizeNumeric(item.quantity, 0);
      entry.presentInInvoice = true;
      if (item.unitRate !== null && item.unitRate !== undefined) {
        entry.invoiceRates.push(normalizeNumeric(item.unitRate));
      }
      if (item.mrp !== null && item.mrp !== undefined) {
        entry.mrpValues.push(normalizeNumeric(item.mrp));
      }
      if (item.description) entry.descriptions.add(item.description);
    }
  }

  // 4. Process Item-level rules & Tolerances
  const items = [];
  const qtyTolerance = config.quantityTolerance;
  const mrpTolerancePct = config.mrpTolerancePercent / 100.0;

  for (const [_, entry] of itemMap.entries()) {
    const itemReasons = new Set();
    const itemWarnings = [];

    // Check if unmapped SKU
    if (!entry.skuMasterId) {
      itemReasons.add('unmapped_master_sku');
      globalReasons.add('unmapped_master_sku');
      softWarnings.add('unmapped_master_sku');
      conflictsList.push({
        code: 'unmapped_master_sku',
        title: `Unmapped SKU: ${entry.sku}`,
        description: `Item '${entry.sku}' could not be resolved against SKU Master catalog.`,
        resolution: 'Map item code to SKU Master catalog using the "+ Map" action.',
        details: { itemCode: entry.sku, skuName: entry.skuName },
      });
    }

    // Check item_missing_in_po (if PO exists but item is not present in PO)
    if (hasPo && !entry.presentInPo && (entry.presentInGrn || entry.presentInInvoice)) {
      itemReasons.add('item_missing_in_po');
      globalReasons.add('item_missing_in_po');
      hardViolations.add('item_missing_in_po');
      conflictsList.push({
        code: 'item_missing_in_po',
        title: `Item Missing in PO: ${entry.skuName || entry.sku}`,
        description: `Line item '${entry.sku}' was delivered/billed but was never ordered in PO ${cleanPoNumber}.`,
        resolution: 'Issue a PO amendment to authorize additional items or reject unlisted items.',
        details: { sku: entry.sku, skuName: entry.skuName, grnQty: entry.grnQty, invoiceQty: entry.invoiceQty },
      });
    }

    // ── Quantity Rules with Configurable Tolerance ──
    // A. GRN vs PO
    if (hasPo && entry.grnQty > entry.poQty) {
      const excess = entry.grnQty - entry.poQty;
      if (excess > qtyTolerance) {
        // Exceeds allowed tolerance -> Hard Conflict
        itemReasons.add('grn_qty_exceeds_po_qty');
        globalReasons.add('grn_qty_exceeds_po_qty');
        hardViolations.add('grn_qty_exceeds_po_qty');
        conflictsList.push({
          code: 'grn_qty_exceeds_po_qty',
          title: `GRN Qty Exceeds PO: ${entry.skuName || entry.sku}`,
          description: `Received ${entry.grnQty} units in GRN vs ${entry.poQty} units ordered in PO (Excess: +${excess} units exceeds tolerance of +${qtyTolerance}).`,
          resolution: 'Initiate goods return process for over-delivered items or obtain approved PO revision.',
          details: { sku: entry.sku, skuName: entry.skuName, poQty: entry.poQty, grnQty: entry.grnQty, excess, tolerance: qtyTolerance },
        });
      } else {
        // Within allowed tolerance -> Accepted with Warning
        softWarnings.add('quantity_within_tolerance');
        const warnObj = {
          code: 'quantity_within_tolerance',
          sku: entry.sku,
          skuName: entry.skuName,
          poQty: entry.poQty,
          grnQty: entry.grnQty,
          invoiceQty: entry.invoiceQty,
          variance: excess,
          tolerance: qtyTolerance,
          status: 'ACCEPTED_WITHIN_TOLERANCE',
          message: `GRN received quantity (+${excess} units) is within allowed tolerance (+${qtyTolerance} units).`,
        };
        itemWarnings.push(warnObj);
        warningsList.push(warnObj);
      }
    }

    // B. Invoice vs GRN (applies same configurable qtyTolerance as PO checks)
    if (hasGrn && entry.invoiceQty > entry.grnQty) {
      const excess = entry.invoiceQty - entry.grnQty;
      if (excess > qtyTolerance) {
        // Exceeds tolerance → Hard Conflict
        itemReasons.add('invoice_qty_exceeds_grn_qty');
        globalReasons.add('invoice_qty_exceeds_grn_qty');
        hardViolations.add('invoice_qty_exceeds_grn_qty');
        conflictsList.push({
          code: 'invoice_qty_exceeds_grn_qty',
          title: `Invoice Qty Exceeds GRN: ${entry.skuName || entry.sku}`,
          description: `Invoiced ${entry.invoiceQty} units vs ${entry.grnQty} units received in GRN (Excess: +${excess} units exceeds tolerance of +${qtyTolerance}).`,
          resolution: 'Verify if remaining goods are in transit. If not received, request a credit note or invoice amendment.',
          details: { sku: entry.sku, skuName: entry.skuName, grnQty: entry.grnQty, invoiceQty: entry.invoiceQty, excess, tolerance: qtyTolerance },
        });
      } else {
        // Within allowed tolerance → Accepted with Warning
        softWarnings.add('quantity_within_tolerance');
        const warnObj = {
          code: 'quantity_within_tolerance',
          sku: entry.sku,
          skuName: entry.skuName,
          poQty: entry.poQty,
          grnQty: entry.grnQty,
          invoiceQty: entry.invoiceQty,
          variance: excess,
          tolerance: qtyTolerance,
          status: 'ACCEPTED_WITHIN_TOLERANCE',
          message: `Invoiced quantity (+${excess} units) exceeds GRN received quantity but is within allowed tolerance (+${qtyTolerance} units).`,
        };
        itemWarnings.push(warnObj);
        warningsList.push(warnObj);
      }
    }

    // C. Invoice vs PO
    if (hasPo && entry.invoiceQty > entry.poQty) {
      const excess = entry.invoiceQty - entry.poQty;
      if (excess > qtyTolerance) {
        // Exceeds allowed tolerance -> Hard Conflict
        itemReasons.add('invoice_qty_exceeds_po_qty');
        globalReasons.add('invoice_qty_exceeds_po_qty');
        hardViolations.add('invoice_qty_exceeds_po_qty');
        conflictsList.push({
          code: 'invoice_qty_exceeds_po_qty',
          title: `Invoice Qty Exceeds PO: ${entry.skuName || entry.sku}`,
          description: `Invoiced ${entry.invoiceQty} units vs ${entry.poQty} units ordered in PO (Excess: +${excess} units exceeds tolerance of +${qtyTolerance}).`,
          resolution: 'Request an approved PO amendment or return/reject excess billed units.',
          details: { sku: entry.sku, skuName: entry.skuName, poQty: entry.poQty, invoiceQty: entry.invoiceQty, excess, tolerance: qtyTolerance },
        });
      } else {
        // Within allowed tolerance -> Accepted with Warning
        softWarnings.add('quantity_within_tolerance');
        const warnObj = {
          code: 'quantity_within_tolerance',
          sku: entry.sku,
          skuName: entry.skuName,
          poQty: entry.poQty,
          grnQty: entry.grnQty,
          invoiceQty: entry.invoiceQty,
          variance: excess,
          tolerance: qtyTolerance,
          status: 'ACCEPTED_WITHIN_TOLERANCE',
          message: `Invoiced quantity (+${excess} units) is within allowed PO tolerance (+${qtyTolerance} units).`,
        };
        itemWarnings.push(warnObj);
        warningsList.push(warnObj);
      }
    }

    // Price mismatch check (tolerance rule: abs(invoiceRate - agreedRate) / agreedRate > priceTolerance)
    let primaryInvoiceRate = entry.invoiceRates.length > 0 ? entry.invoiceRates[0] : null;
    if (entry.agreedRate !== null && entry.agreedRate > 0 && primaryInvoiceRate !== null) {
      const diffFraction = Math.abs(primaryInvoiceRate - entry.agreedRate) / entry.agreedRate;
      if (diffFraction > entry.priceTolerance) {
        itemReasons.add('price_mismatch');
        globalReasons.add('price_mismatch');
        softWarnings.add('price_mismatch');
        conflictsList.push({
          code: 'price_mismatch',
          title: `Price Mismatch: ${entry.skuName || entry.sku}`,
          description: `Invoice unit rate ₹${primaryInvoiceRate.toFixed(2)} differs from SKU Master agreed rate ₹${entry.agreedRate.toFixed(2)} (${(diffFraction * 100).toFixed(1)}% variance vs ${(entry.priceTolerance * 100).toFixed(0)}% tolerance).`,
          resolution: 'Verify contract terms and request a revised invoice matching agreed rate.',
          details: { sku: entry.sku, agreedRate: entry.agreedRate, invoiceRate: primaryInvoiceRate, variancePct: Number((diffFraction * 100).toFixed(2)) },
        });
      }
    }

    // MRP mismatch check (tolerance rule: abs(mrp - masterMrp) / masterMrp > mrpTolerancePct)
    let primaryMrp = entry.mrpValues.length > 0 ? entry.mrpValues[0] : null;
    if (entry.masterMrp !== null && entry.masterMrp > 0 && primaryMrp !== null) {
      const mrpDiffFraction = Math.abs(primaryMrp - entry.masterMrp) / entry.masterMrp;
      if (mrpDiffFraction > mrpTolerancePct) {
        itemReasons.add('mrp_mismatch');
        globalReasons.add('mrp_mismatch');
        softWarnings.add('mrp_mismatch');
        conflictsList.push({
          code: 'mrp_mismatch',
          title: `MRP Mismatch: ${entry.skuName || entry.sku}`,
          description: `Document MRP ₹${primaryMrp.toFixed(2)} differs from SKU Master MRP ₹${entry.masterMrp.toFixed(2)} (${(mrpDiffFraction * 100).toFixed(1)}% variance > ${(mrpTolerancePct * 100).toFixed(0)}%).`,
          resolution: 'Check physical packaging batch MRP. Update SKU Master if legitimate manufacturer price revision occurred.',
          details: { sku: entry.sku, masterMrp: entry.masterMrp, documentMrp: primaryMrp, variancePct: Number((mrpDiffFraction * 100).toFixed(2)) },
        });
      }
    }

    const pendingQty = Math.max(0, entry.poQty - entry.grnQty);
    const skuName = entry.skuName || Array.from(entry.descriptions)[0] || entry.sku;

    // Item reconciliation status
    let lineStatus = 'matched';
    if (itemReasons.size > 0) {
      lineStatus = 'mismatch';
    } else if (itemWarnings.length > 0) {
      lineStatus = 'accepted_within_tolerance';
    }

    items.push({
      sku: entry.sku,
      skuName,
      erpCode: entry.erpCode,
      eanCode: entry.eanCode,
      hsnCode: entry.hsnCode,
      uom: entry.uom,
      poQty: entry.poQty,
      grnQty: entry.grnQty,
      invoiceQty: entry.invoiceQty,
      pendingQty,
      agreedRate: entry.agreedRate,
      invoiceRate: primaryInvoiceRate,
      mrp: primaryMrp || entry.masterMrp,
      reasons: Array.from(itemReasons),
      warnings: itemWarnings,
      status: lineStatus,
    });
  }

  // Calculate Overall Status
  let status = 'insufficient_documents';
  let statusLabel = 'INSUFFICIENT_DOCUMENTS';
  const isCompleteSet = hasPo && hasGrn && hasInvoice;

  if (!isCompleteSet) {
    status = 'insufficient_documents';
    statusLabel = 'INSUFFICIENT_DOCUMENTS';
  } else if (hardViolations.size > 0) {
    status = 'mismatch';
    statusLabel = 'HARD_MISMATCH';
  } else if (softWarnings.size > 0 || warningsList.length > 0) {
    status = 'partially_matched';
    statusLabel = 'MATCHED_WITH_WARNINGS';
  } else {
    status = 'matched';
    statusLabel = 'MATCHED';
  }

  const matchResult = {
    poNumber: cleanPoNumber,
    status,
    statusLabel,
    reasons: Array.from(globalReasons),
    conflicts: conflictsList,
    warnings: warningsList,
    dateFlow: dateFlowInfo,
    config: {
      quantityTolerance: config.quantityTolerance,
      mrpTolerancePercent: config.mrpTolerancePercent,
    },
    documents: {
      po: poDocs[0] || null,
      pos: poDocs,
      grns: grnDocs,
      invoices: invoiceDocs,
    },
    items,
  };

  return matchResult;
}

module.exports = {
  matchPurchaseOrder,
};
