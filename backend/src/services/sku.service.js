const { SkuMaster } = require('../models');

/**
 * Resolve a single itemCode against SkuMaster
 * 1. Trim whitespace
 * 2. Case-insensitive match on skuErpCode
 * 3. Case-insensitive match on eanCode
 * 4. Return matching SkuMaster document or null
 */
async function resolveSku(itemCode) {
  if (!itemCode || typeof itemCode !== 'string') {
    return null;
  }

  const cleanCode = itemCode.trim();
  if (!cleanCode) return null;

  // Escape special regex characters
  const escapedCode = cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedCode}$`, 'i');

  // Step 2: match by skuErpCode
  let sku = await SkuMaster.findOne({ skuErpCode: regex }).exec();
  if (sku) return sku;

  // Step 3: match by eanCode
  sku = await SkuMaster.findOne({ eanCode: regex }).exec();
  return sku || null;
}

/**
 * Resolve all items in a document, updating skuMaster ObjectId reference
 */
async function resolveDocumentItems(items = []) {
  const resolvedItems = [];
  const warnings = [];

  for (const item of items) {
    const rawCode = item.itemCode ? String(item.itemCode).trim() : '';
    const sku = await resolveSku(rawCode);

    if (!sku) {
      warnings.push({
        itemCode: rawCode,
        warning: 'unmapped_master_sku',
        message: `SKU '${rawCode}' could not be resolved in SKU Master.`,
      });
    }

    resolvedItems.push({
      ...item,
      itemCode: rawCode,
      skuMaster: sku ? sku._id : null,
    });
  }

  return { resolvedItems, warnings };
}

module.exports = {
  resolveSku,
  resolveDocumentItems,
};
