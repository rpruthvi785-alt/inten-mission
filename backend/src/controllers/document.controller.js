const fs = require('fs');
const path = require('path');
const {
  PurchaseOrder,
  Grn,
  Invoice,
  MatchAudit,
} = require('../models');
const { parseDocumentWithGemini } = require('../services/gemini.service');
const { getValidatorForType } = require('../validators/document.validator');
const { resolveDocumentItems } = require('../services/sku.service');

// No Supabase — files are stored locally in /uploads


/**
 * Handle document upload and parsing
 */
const uploadDocument = async (req, res, next) => {
  try {
    const file = req.file;
    const documentType = (req.body.documentType || req.query.documentType || '').toLowerCase().trim();

    if (!documentType) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'documentType is required (po, grn, invoice)' });
    }

    let parsedData = null;
    let rawParsed = null;
    let rawText = '';

    // If pre-parsed JSON payload is provided (e.g. for test seed or manual upload override)
    if (req.body.parsedData) {
      try {
        const rawObj = typeof req.body.parsedData === 'string' ? JSON.parse(req.body.parsedData) : req.body.parsedData;
        const validator = getValidatorForType(documentType);
        parsedData = validator.parse(rawObj);
        rawParsed = rawObj;
      } catch (err) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({ error: `Validation error in provided parsedData: ${err.message}` });
      }
    } else {
      if (!file) {
        return res.status(400).json({ error: 'File is required' });
      }

      // Parse with Gemini
      const geminiResult = await parseDocumentWithGemini(file.path, documentType, file.mimetype);
      parsedData = geminiResult.data;
      rawParsed = geminiResult.raw;
      rawText = geminiResult.rawText;
    }

    // Step 10: Resolve SKU Master for each line item
    const { resolvedItems, warnings } = await resolveDocumentItems(parsedData.items);

    let savedDocument = null;
    let duplicateStatus = null;
    let poNumber = '';

    // File is saved locally in /uploads by multer
    const filePath = file ? path.relative(path.join(__dirname, '..', '..'), file.path).replace(/\\/g, '/') : '';
    const fileName = file ? file.originalname : 'payload.json';


    // Step 11 & 12: Persist Document and Run Duplicate Detection
    if (documentType === 'po' || documentType === 'purchaseorder') {
      poNumber = String(parsedData.poNumber).trim();
      const existingCount = await PurchaseOrder.countDocuments({ poNumber });
      if (existingCount > 0) {
        duplicateStatus = 'duplicate_po';
      }

      savedDocument = await PurchaseOrder.create({
        poNumber,
        poDate: parsedData.poDate ? new Date(parsedData.poDate) : null,
        vendorName: parsedData.vendorName || '',
        items: resolvedItems,
        rawParsed: rawParsed || parsedData,
        filePath,
        fileName,
      });
    } else if (documentType === 'grn' || documentType === 'delivery') {
      poNumber = String(parsedData.poNumber).trim();
      const grnNumber = String(parsedData.grnNumber).trim();

      const existingCount = await Grn.countDocuments({ poNumber, grnNumber });
      if (existingCount > 0) {
        duplicateStatus = 'duplicate_document';
      }

      savedDocument = await Grn.create({
        grnNumber,
        poNumber,
        grnDate: parsedData.grnDate ? new Date(parsedData.grnDate) : null,
        items: resolvedItems,
        rawParsed: rawParsed || parsedData,
        filePath,
        fileName,
      });
    } else if (documentType === 'invoice' || documentType === 'fulfillment') {
      poNumber = String(parsedData.poNumber).trim();
      const invoiceNumber = String(parsedData.invoiceNumber).trim();

      const existingCount = await Invoice.countDocuments({ poNumber, invoiceNumber });
      if (existingCount > 0) {
        duplicateStatus = 'duplicate_document';
      }

      savedDocument = await Invoice.create({
        invoiceNumber,
        poNumber,
        invoiceDate: parsedData.invoiceDate ? new Date(parsedData.invoiceDate) : null,
        items: resolvedItems,
        rawParsed: rawParsed || parsedData,
        filePath,
        fileName,
      });
    } else {
      return res.status(400).json({ error: `Unsupported documentType: ${documentType}` });
    }

    // Step 13: Create / Update MatchAudit
    const auditSteps = [
      {
        step: `UPLOAD_${documentType.toUpperCase()}`,
        status: 'SUCCESS',
        message: `${documentType.toUpperCase()} uploaded and parsed successfully.`,
      },
    ];

    if (duplicateStatus) {
      auditSteps.push({
        step: 'DUPLICATE_DETECTION',
        status: 'WARNING',
        message: `Duplicate detected: ${duplicateStatus}`,
      });
    }

    if (warnings.length > 0) {
      auditSteps.push({
        step: 'SKU_RESOLUTION',
        status: 'WARNING',
        message: `${warnings.length} item(s) unmapped in SKU Master.`,
      });
    }

    await MatchAudit.create({
      poNumber,
      steps: auditSteps,
    });

    // File stored locally. No remote sync.

    return res.status(201).json({
      message: `${documentType.toUpperCase()} processed successfully`,
      documentType,
      poNumber,
      duplicateStatus,
      warnings,
      document: savedDocument,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Get documents filtered by type and poNumber
 */
const getDocuments = async (req, res, next) => {
  try {
    const { type, poNumber } = req.query;
    const results = {};

    const filter = {};
    if (poNumber) filter.poNumber = poNumber.trim();

    if (!type || type === 'po') {
      results.pos = await PurchaseOrder.find(filter).populate('items.skuMaster').sort({ createdAt: -1 });
    }
    if (!type || type === 'grn') {
      results.grns = await Grn.find(filter).populate('items.skuMaster').sort({ createdAt: -1 });
    }
    if (!type || type === 'invoice') {
      results.invoices = await Invoice.find(filter).populate('items.skuMaster').sort({ createdAt: -1 });
    }

    return res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single document by ID
 */
const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let doc = await PurchaseOrder.findById(id).populate('items.skuMaster');
    let docType = 'po';

    if (!doc) {
      doc = await Grn.findById(id).populate('items.skuMaster');
      docType = 'grn';
    }
    if (!doc) {
      doc = await Invoice.findById(id).populate('items.skuMaster');
      docType = 'invoice';
    }

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.status(200).json({ documentType: docType, document: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream/serve original file for preview/download
 */
const getDocumentFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    let doc = await PurchaseOrder.findById(id);
    if (!doc) doc = await Grn.findById(id);
    if (!doc) doc = await Invoice.findById(id);

    if (!doc || !doc.filePath) {
      return res.status(404).json({ error: 'Document or associated file not found' });
    }

    const fullPath = path.join(__dirname, '..', '..', doc.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Physical file not found on server disk' });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName || path.basename(fullPath)}"`);

    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  getDocumentFile,
};
