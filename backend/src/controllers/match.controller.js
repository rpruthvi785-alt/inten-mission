const { matchPurchaseOrder } = require('../services/match.service');
const { MatchAudit } = require('../models');

/**
 * GET /match/:poNumber
 * Dynamic Three-Way Match computation
 */
const getMatchForPo = async (req, res, next) => {
  try {
    const { poNumber } = req.params;
    if (!poNumber) {
      return res.status(400).json({ error: 'poNumber parameter is required' });
    }

    const matchResult = await matchPurchaseOrder(poNumber);
    return res.status(200).json(matchResult);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /summary/:poNumber
 * Executive Summary statistics for PO, GRN, Invoices & Current Status
 */
const getSummaryForPo = async (req, res, next) => {
  try {
    const { poNumber } = req.params;
    if (!poNumber) {
      return res.status(400).json({ error: 'poNumber parameter is required' });
    }

    const matchResult = await matchPurchaseOrder(poNumber);
    const audits = await MatchAudit.find({ poNumber }).sort({ createdAt: -1 }).limit(10);

    const { documents, items, status, reasons } = matchResult;

    let poAmount = 0;
    let totalInvoiced = 0;
    let totalReceived = 0;
    let cumulativePoQty = 0;
    let cumulativeReceivedQty = 0;
    let cumulativeInvoicedQty = 0;

    for (const item of items) {
      cumulativePoQty += Number(item.poQty || 0);
      cumulativeReceivedQty += Number(item.grnQty || 0);
      cumulativeInvoicedQty += Number(item.invoiceQty || 0);

      const rate = item.agreedRate || item.invoiceRate || 0;
      poAmount += item.poQty * rate;

      const invRate = item.invoiceRate || item.agreedRate || 0;
      totalInvoiced += item.invoiceQty * invRate;

      const grnRate = item.agreedRate || item.invoiceRate || 0;
      totalReceived += item.grnQty * grnRate;
    }

    const pendingDelivery = Math.max(0, cumulativePoQty - cumulativeReceivedQty);

    const summaryResponse = {
      poNumber: matchResult.poNumber,
      poAmount: Number(poAmount.toFixed(2)),
      totalInvoiced: Number(totalInvoiced.toFixed(2)),
      totalReceived: Number(totalReceived.toFixed(2)),
      cumulativePoQty,
      cumulativeReceivedQty,
      cumulativeInvoicedQty,
      pendingDelivery,
      currentStatus: status,
      reasons,
      linkedDocuments: {
        poCount: (documents.pos || []).length,
        grnCount: (documents.grns || []).length,
        invoiceCount: (documents.invoices || []).length,
        pos: (documents.pos || []).map(p => ({ id: p._id, poNumber: p.poNumber, date: p.poDate, vendor: p.vendorName })),
        grns: (documents.grns || []).map(g => ({ id: g._id, grnNumber: g.grnNumber, date: g.grnDate, itemCount: (g.items || []).length })),
        invoices: (documents.invoices || []).map(i => ({ id: i._id, invoiceNumber: i.invoiceNumber, date: i.invoiceDate, itemCount: (i.items || []).length })),
      },
      auditHistory: audits,
    };

    return res.status(200).json(summaryResponse);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMatchForPo,
  getSummaryForPo,
};
