const { SkuMaster } = require('../models');

/**
 * List all SKU Master items
 */
const getSkus = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      const clean = search.trim();
      const regex = new RegExp(clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { skuErpCode: regex },
        { name: regex },
        { eanCode: regex },
        { hsnCode: regex },
      ];
    }

    const skus = await SkuMaster.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(skus);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new SKU Master item
 */
const createSku = async (req, res, next) => {
  try {
    const {
      skuErpCode,
      name,
      eanCode,
      hsnCode,
      uom,
      agreedRate,
      mrp,
      priceTolerance,
    } = req.body;

    if (!skuErpCode || !name) {
      return res.status(400).json({ error: 'skuErpCode and name are required' });
    }

    const cleanErpCode = String(skuErpCode).trim();
    const existing = await SkuMaster.findOne({ skuErpCode: cleanErpCode });
    if (existing) {
      return res.status(409).json({ error: `SKU with ERP code '${cleanErpCode}' already exists` });
    }

    const sku = await SkuMaster.create({
      skuErpCode: cleanErpCode,
      name: String(name).trim(),
      eanCode: eanCode ? String(eanCode).trim() : '',
      hsnCode: hsnCode ? String(hsnCode).trim() : '',
      uom: uom ? String(uom).trim() : 'NOS',
      agreedRate: agreedRate !== undefined && agreedRate !== '' ? Number(agreedRate) : null,
      mrp: mrp !== undefined && mrp !== '' ? Number(mrp) : null,
      priceTolerance: priceTolerance !== undefined && priceTolerance !== '' ? Number(priceTolerance) : 0.05,
    });

    return res.status(201).json(sku);
  } catch (error) {
    next(error);
  }
};

/**
 * Update SKU Master item
 */
const updateSku = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.skuErpCode) {
      updates.skuErpCode = String(updates.skuErpCode).trim();
    }
    if (updates.eanCode !== undefined) {
      updates.eanCode = String(updates.eanCode).trim();
    }
    if (updates.agreedRate !== undefined && updates.agreedRate !== '') {
      updates.agreedRate = Number(updates.agreedRate);
    }
    if (updates.mrp !== undefined && updates.mrp !== '') {
      updates.mrp = Number(updates.mrp);
    }
    if (updates.priceTolerance !== undefined && updates.priceTolerance !== '') {
      updates.priceTolerance = Number(updates.priceTolerance);
    }

    const updatedSku = await SkuMaster.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedSku) {
      return res.status(404).json({ error: 'SKU Master item not found' });
    }

    return res.status(200).json(updatedSku);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete SKU Master item
 */
const deleteSku = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await SkuMaster.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'SKU Master item not found' });
    }

    return res.status(200).json({ message: 'SKU deleted successfully', id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSkus,
  createSku,
  updateSku,
  deleteSku,
};
