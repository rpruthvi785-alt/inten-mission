/**
 * REAL DATA SEED — Three-Way Match Engine
 * Source: Actual PO CI4PO05788, GRN CI4000020234, Invoice IN25MH2504251
 *
 * SKU resolution mapping:
 *   skuErpCode = PO/GRN numeric code (e.g. "11423", "253430", "33390")
 *   eanCode    = Invoice code        (e.g. "FG-P-F-0503", "FG-P-F-0249")
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const {
  SkuMaster,
  PurchaseOrder,
  Grn,
  Invoice,
  MatchAudit,
} = require('../src/models');
const { resolveDocumentItems } = require('../src/services/sku.service');

// ─── SKU MASTER ────────────────────────────────────────────────────────────────
const realSkus = [
  { skuErpCode: '11423',       eanCode: 'FG-P-F-0503', hsnCode: '19022010', name: 'PSM Cheesy Spicy Vegetable Momos 24Pcs',         uom: 'PKT', agreedRate: 220.76, mrp: 305.00, priceTolerance: 0.05 },
  { skuErpCode: '11797',       eanCode: 'FG-M-F-1703', hsnCode: '20071400', name: 'Meatigo RTC Hot Wings 250g',                      uom: 'PKT', agreedRate: 126.67, mrp: 175.00, priceTolerance: 0.05 },
  { skuErpCode: '18003',       eanCode: 'FG-M-F-0820', hsnCode: '02071300', name: 'Meatigo Chicken Curry Cuts 450g',                 uom: 'PKT', agreedRate: 141.14, mrp: 195.00, priceTolerance: 0.05 },
  { skuErpCode: '18004',       eanCode: 'FG-M-F-0819', hsnCode: '02071300', name: 'Meatigo Chicken Boneless Breast 450g',            uom: 'PKT', agreedRate: 199.05, mrp: 275.00, priceTolerance: 0.05 },
  { skuErpCode: '253430',      eanCode: 'FG-P-F-0249', hsnCode: '16010000', name: 'PSM Pork Plain Salami 200g',                     uom: 'PKT', agreedRate: 188.19, mrp: 260.00, priceTolerance: 0.05 },
  { skuErpCode: '33387',       eanCode: 'FG-P-F-0234', hsnCode: '16010000', name: 'PSM Frozen Chicken Chilli Salami 200g',           uom: 'PKT', agreedRate: 126.67, mrp: 175.00, priceTolerance: 0.05 },
  { skuErpCode: '33390',       eanCode: 'FG-P-F-0413', hsnCode: '16010000', name: 'PSM Frozen Chicken Seekh Kabab 500g',             uom: 'PKT', agreedRate: 228.00, mrp: 315.00, priceTolerance: 0.05 },
  { skuErpCode: '398656',      eanCode: 'FG-M-F-0802', hsnCode: '02071400', name: 'Meatigo Chicken Drumsticks 450g',                 uom: 'PKT', agreedRate: 188.19, mrp: 260.00, priceTolerance: 0.05 },
  { skuErpCode: '414867',      eanCode: 'FG-P-F-1707', hsnCode: '20049000', name: 'PSM Spring Roll - Chinese Veg 240g',              uom: 'PKT', agreedRate: 119.43, mrp: 165.00, priceTolerance: 0.05 },
  { skuErpCode: '205950',      eanCode: '205950',      hsnCode: '16010000', name: 'PSM Frozen Pork Pepperoni Salami 100g',           uom: 'PKT', agreedRate: 133.91, mrp: 185.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-M-F-0622', eanCode: 'FG-M-F-0622', hsnCode: '02071400', name: 'Meatigo Chicken Keema (Mince) 450g',            uom: 'PKT', agreedRate: 199.05, mrp: 275.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0505', eanCode: 'FG-P-F-0505', hsnCode: '19022010', name: 'PSM Chicken Momos 24Pcs',                   uom: 'PKT', agreedRate: 220.76, mrp: 305.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0512', eanCode: 'FG-P-F-0512', hsnCode: '19022010', name: 'PSM Spicy Chicken Momos 24Pcs',              uom: 'PKT', agreedRate: 220.76, mrp: 305.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0514', eanCode: 'FG-P-F-0514', hsnCode: '19022010', name: 'PSM Vegetable & Paneer Momos 24Pcs',         uom: 'PKT', agreedRate: 202.67, mrp: 280.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0335', eanCode: 'FG-P-F-0335', hsnCode: '16010000', name: 'PSM Chicken Cheese & Onion Sausage 250g',   uom: 'PKT', agreedRate: 144.76, mrp: 200.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0504', eanCode: 'FG-P-F-0504', hsnCode: '19022010', name: 'PSM Chicken Momos 10Pcs',                   uom: 'PKT', agreedRate: 133.90, mrp: 185.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0513', eanCode: 'FG-P-F-0513', hsnCode: '19022010', name: 'PSM Vegetable & Paneer Momos 10Pcs',         uom: 'PKT', agreedRate: 112.19, mrp: 155.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-M-F-1728', eanCode: 'FG-M-F-1728', hsnCode: '16021000', name: 'Meatigo RTC Everyday Chicken Breast 150g', uom: 'PKT', agreedRate: 119.43, mrp: 165.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0323', eanCode: 'FG-P-F-0323', hsnCode: '16010000', name: 'PSM Frozen Pork Sausage 250g',               uom: 'PKT', agreedRate: 170.10, mrp: 235.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0236', eanCode: 'FG-P-F-0236', hsnCode: '16010000', name: 'PSM Frozen Pork Ham 200g',                   uom: 'PKT', agreedRate: 177.33, mrp: 245.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0580', eanCode: 'FG-P-F-0580', hsnCode: '19022010', name: 'PSM Whole Wheat Momos - Veg & Paneer 330g', uom: 'PKT', agreedRate: 162.86, mrp: 225.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0527', eanCode: 'FG-P-F-0527', hsnCode: '19022010', name: 'PSM Peri Peri Veg Momos 15Pcs',             uom: 'PKT', agreedRate: 88.67,  mrp: 125.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0247', eanCode: 'FG-P-F-0247', hsnCode: '16010000', name: 'PSM Frozen Chicken Salami 200g',             uom: 'PKT', agreedRate: 137.52, mrp: 190.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0102', eanCode: 'FG-P-F-0102', hsnCode: '16010000', name: 'PSM Frozen Pork Breakfast Bacon 150g',       uom: 'PKT', agreedRate: 152.00, mrp: 210.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0321', eanCode: 'FG-P-F-0321', hsnCode: '16010000', name: 'PSM Frozen Sausage 250g',                    uom: 'PKT', agreedRate: 130.29, mrp: 180.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0581', eanCode: 'FG-P-F-0581', hsnCode: '19022010', name: 'PSM Whole Wheat Momos - Chicken 330g',       uom: 'PKT', agreedRate: 170.10, mrp: 235.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0501', eanCode: 'FG-P-F-0501', hsnCode: '19022010', name: 'PSM FS Chef Momo - Chicken 1kg',             uom: 'KG',  agreedRate: 247.62, mrp: 340.00, priceTolerance: 0.05 },
  { skuErpCode: 'FG-P-F-0564', eanCode: 'FG-P-F-0564', hsnCode: '19022010', name: 'PSM Cheese & Chicken Momos 540g',            uom: 'PKT', agreedRate: 238.86, mrp: 330.00, priceTolerance: 0.05 },
];

// ─── PURCHASE ORDER CI4PO05788 ─────────────────────────────────────────────────
// PO Date: Mar 17, 2026
const poItemsRaw = [
  { itemCode: '11423',       description: 'PSM Cheesy Spicy Veg Momos 24.0 Pieces',         quantity: 50  },
  { itemCode: '11797',       description: 'Meatigo Hot Wings 250.0g',                         quantity: 75  },
  { itemCode: '18003',       description: 'Meatigo Chicken Curry Cut Skinless Frozen 450.0g', quantity: 120 },
  { itemCode: '18004',       description: 'Meatigo Chicken Boneless Breast Frozen 450.0g',    quantity: 540 },
  { itemCode: '253430',      description: 'PSM Pork Plain Salami 200g',                       quantity: 75  },
  { itemCode: '33387',       description: 'PSM Frozen Chicken Chilli Salami 200g',            quantity: 75  },
  { itemCode: '33390',       description: 'PSM Frozen Chicken Seekh Kabab 500g',              quantity: 270 },
  { itemCode: '398656',      description: 'Meatigo Chicken Drumsticks 450g',                  quantity: 270 },
  { itemCode: '414867',      description: 'PSM Spring Roll - Chinese Veg 240g',               quantity: 25  },
  { itemCode: '205950',      description: 'PSM Frozen Pork Pepperoni Salami 100g',            quantity: 40  },
  { itemCode: 'FG-M-F-0622', description: 'Meatigo Chicken Keema (Mince) 450g',              quantity: 360 },
  { itemCode: 'FG-P-F-0505', description: 'PSM Chicken Momos 24Pcs',                         quantity: 475 },
  { itemCode: 'FG-P-F-0512', description: 'PSM Spicy Chicken Momos 24Pcs',                   quantity: 325 },
  { itemCode: 'FG-P-F-0514', description: 'PSM Vegetable & Paneer Momos 24Pcs',               quantity: 75  },
  { itemCode: 'FG-P-F-0335', description: 'PSM Chicken Cheese & Onion Sausage 250g',         quantity: 40  },
  { itemCode: 'FG-P-F-0504', description: 'PSM Chicken Momos 10Pcs',                         quantity: 450 },
  { itemCode: 'FG-P-F-0513', description: 'PSM Vegetable & Paneer Momos 10Pcs',               quantity: 400 },
  { itemCode: 'FG-M-F-1728', description: 'Meatigo RTC Everyday Chicken Breast 150g',        quantity: 90  },
  { itemCode: 'FG-P-F-0323', description: 'PSM Frozen Pork Sausage 250g',                    quantity: 40  },
  { itemCode: 'FG-P-F-0236', description: 'PSM Frozen Pork Ham 200g',                        quantity: 50  },
  { itemCode: 'FG-P-F-0580', description: 'PSM Whole Wheat Momos - Veg & Paneer 330g',       quantity: 40  },
  { itemCode: 'FG-P-F-0527', description: 'PSM Peri Peri Veg Momos 15Pcs',                   quantity: 80  },
  { itemCode: 'FG-P-F-0247', description: 'PSM Frozen Chicken Salami 200g',                  quantity: 25  },
  { itemCode: 'FG-P-F-0102', description: 'PSM Frozen Pork Breakfast Bacon 150g',             quantity: 36  },
  { itemCode: 'FG-P-F-0321', description: 'PSM Frozen Sausage 250g',                         quantity: 380 },
  { itemCode: 'FG-P-F-0581', description: 'PSM Whole Wheat Momos - Chicken 330g',            quantity: 80  },
  { itemCode: 'FG-P-F-0501', description: 'PSM FS Chef Momo - Chicken 1kg',                  quantity: 72  },
  { itemCode: 'FG-P-F-0564', description: 'PSM Cheese & Chicken Momos 540g',                 quantity: 25  },
];

// ─── GRN CI4000020234 ──────────────────────────────────────────────────────────
// GRN Date: 24-3-2026
const grnItemsRaw = [
  { itemCode: '11423',       description: 'PSM Cheesy Spicy Veg Momos 24.0 Pieces',         receivedQuantity: 50,  mrp: 305.00 },
  { itemCode: '11797',       description: 'Meatigo Hot Wings 250.0g',                         receivedQuantity: 75,  mrp: 175.00 },
  { itemCode: '18003',       description: 'Meatigo Chicken Curry Cut Skinless Frozen 450g',   receivedQuantity: 30,  mrp: 195.00 },  // Shortfall vs 120 ordered
  { itemCode: '18004',       description: 'Meatigo Chicken Boneless Breast Frozen 450g',      receivedQuantity: 30,  mrp: 275.00 },  // Shortfall vs 540 ordered
  { itemCode: '253430',      description: 'PSM Pork Salami 200g',                             receivedQuantity: 75,  mrp: 260.00 },
  { itemCode: '33387',       description: 'PSM Frozen Chicken Chilli Salami 200g',            receivedQuantity: 75,  mrp: 175.00 },
  { itemCode: '33390',       description: 'PSM Chicken Seekh Kebab 500g',                     receivedQuantity: 272, mrp: 315.00 },  // 2 units excess vs 270 ordered
  { itemCode: '398656',      description: 'Meatigo Chicken Drumsticks 450g',                  receivedQuantity: 270, mrp: 260.00 },
  { itemCode: '414867',      description: 'PSM Chinese Veg Spring Rolls 240g',                receivedQuantity: 25,  mrp: 165.00 },
  { itemCode: '205950',      description: 'PSM Frozen Pork Pepperoni Salami 100g',            receivedQuantity: 40,  mrp: 185.00 },
  { itemCode: 'FG-M-F-0622', description: 'Meatigo Chicken Keema (Mince) 450g',              receivedQuantity: 360, mrp: 275.00 },
  { itemCode: 'FG-P-F-0505', description: 'PSM Chicken Momos 24Pcs',                         receivedQuantity: 475, mrp: 305.00 },
  { itemCode: 'FG-P-F-0512', description: 'PSM Spicy Chicken Momos 24Pcs',                   receivedQuantity: 325, mrp: 305.00 },
  { itemCode: 'FG-P-F-0514', description: 'PSM Vegetable & Paneer Momos 24Pcs',               receivedQuantity: 75,  mrp: 280.00 },
  { itemCode: 'FG-P-F-0335', description: 'PSM Chicken Cheese & Onion Sausage 250g',         receivedQuantity: 40,  mrp: 200.00 },
  { itemCode: 'FG-P-F-0504', description: 'PSM Chicken Momos 10Pcs',                         receivedQuantity: 450, mrp: 185.00 },
  { itemCode: 'FG-P-F-0513', description: 'PSM Vegetable & Paneer Momos 10Pcs',               receivedQuantity: 400, mrp: 155.00 },
  { itemCode: 'FG-M-F-1728', description: 'Meatigo RTC Everyday Chicken Breast 150g',        receivedQuantity: 90,  mrp: 165.00 },
  { itemCode: 'FG-P-F-0323', description: 'PSM Frozen Pork Sausage 250g',                    receivedQuantity: 40,  mrp: 235.00 },
  { itemCode: 'FG-P-F-0236', description: 'PSM Frozen Pork Ham 200g',                        receivedQuantity: 50,  mrp: 245.00 },
  { itemCode: 'FG-P-F-0580', description: 'PSM Whole Wheat Momos - Veg & Paneer 330g',       receivedQuantity: 40,  mrp: 225.00 },
  { itemCode: 'FG-P-F-0527', description: 'PSM Peri Peri Veg Momos 15Pcs',                   receivedQuantity: 80,  mrp: 125.00 },
  { itemCode: 'FG-P-F-0247', description: 'PSM Frozen Chicken Salami 200g',                  receivedQuantity: 25,  mrp: 190.00 },
  { itemCode: 'FG-P-F-0102', description: 'PSM Frozen Pork Breakfast Bacon 150g',             receivedQuantity: 36,  mrp: 210.00 },
  { itemCode: 'FG-P-F-0321', description: 'PSM Frozen Sausage 250g',                         receivedQuantity: 380, mrp: 180.00 },
  { itemCode: 'FG-P-F-0581', description: 'PSM Whole Wheat Momos - Chicken 330g',            receivedQuantity: 80,  mrp: 235.00 },
  { itemCode: 'FG-P-F-0501', description: 'PSM FS Chef Momo - Chicken 1kg',                  receivedQuantity: 72,  mrp: 340.00 },
  { itemCode: 'FG-P-F-0564', description: 'PSM Cheese & Chicken Momos 540g',                 receivedQuantity: 25,  mrp: 330.00 },
];

// ─── INVOICE IN25MH2504251 ─────────────────────────────────────────────────────
// Invoice Date: 24/03/2026
const invoiceItemsRaw = [
  { itemCode: 'FG-P-F-0503', description: 'PSM Cheesy Spicy Vegetable Momos 24Pcs',           quantity: 50,  unitRate: 220.76, mrp: 305.00 },
  { itemCode: 'FG-M-F-1703', description: 'Meatigo RTC Meatigo Hot Wings 250g',                quantity: 75,  unitRate: 126.67, mrp: 175.00 },
  { itemCode: 'FG-M-F-0820', description: 'Meatigo Chicken Curry Cuts 450g (5%)',               quantity: 30,  unitRate: 141.14, mrp: 195.00 },
  { itemCode: 'FG-M-F-0819', description: 'Meatigo Chicken Boneless Breast 450g (5%)',          quantity: 30,  unitRate: 199.05, mrp: 275.00 },
  { itemCode: 'FG-P-F-0249', description: 'PSM Pork Plain Salami 200g',                        quantity: 75,  unitRate: 188.19, mrp: 260.00 },
  { itemCode: 'FG-P-F-0234', description: 'PSM Frozen Chicken Chilli Salami 200g',              quantity: 75,  unitRate: 126.67, mrp: 175.00 },
  { itemCode: 'FG-P-F-0413', description: 'PSM Frozen Chicken Seekh Kabab 500g',                quantity: 272, unitRate: 228.00, mrp: 315.00 },
  { itemCode: 'FG-M-F-0802', description: 'Meatigo Chicken Drumsticks 450g (5%)',               quantity: 270, unitRate: 188.19, mrp: 260.00 },
  { itemCode: 'FG-P-F-1707', description: 'PSM Spring Roll - Chinese Veg 240g',                 quantity: 25,  unitRate: 119.43, mrp: 165.00 },
  { itemCode: 'FG-M-F-0622', description: 'Meatigo Chicken Keema (Mince) 450g (5%)',            quantity: 360, unitRate: 199.05, mrp: 275.00 },
  { itemCode: 'FG-P-F-0505', description: 'PSM Chicken Momos 24Pcs',                           quantity: 475, unitRate: 220.76, mrp: 305.00 },
  { itemCode: 'FG-P-F-0512', description: 'PSM Spicy Chicken Momos 24Pcs',                     quantity: 325, unitRate: 220.76, mrp: 305.00 },
  { itemCode: 'FG-P-F-0514', description: 'PSM Vegetable & Paneer Momos 24Pcs',                 quantity: 75,  unitRate: 202.67, mrp: 280.00 },
  { itemCode: 'FG-P-F-0335', description: 'PSM Chicken Cheese & Onion Sausage 250g',           quantity: 40,  unitRate: 144.76, mrp: 200.00 },
  { itemCode: 'FG-P-F-0504', description: 'PSM Chicken Momos 10Pcs',                           quantity: 450, unitRate: 133.90, mrp: 185.00 },
  { itemCode: 'FG-P-F-0513', description: 'PSM Vegetable & Paneer Momos 10Pcs',                 quantity: 400, unitRate: 112.19, mrp: 155.00 },
  { itemCode: 'FG-M-F-1728', description: 'Meatigo RTC Everyday Chicken Breast 150g',          quantity: 90,  unitRate: 119.43, mrp: 165.00 },
  { itemCode: 'FG-P-F-0323', description: 'PSM Frozen Pork Sausage 250g',                      quantity: 40,  unitRate: 170.10, mrp: 235.00 },
  { itemCode: 'FG-P-F-0236', description: 'PSM Frozen Pork Ham 200g',                          quantity: 50,  unitRate: 177.33, mrp: 245.00 },
  { itemCode: 'FG-P-F-0580', description: 'PSM Whole Wheat Momos - Veg & Paneer 330g',         quantity: 40,  unitRate: 162.86, mrp: 225.00 },
  { itemCode: 'FG-P-F-0527', description: 'PSM Peri Peri Veg Momos 15Pcs',                     quantity: 80,  unitRate: 88.67,  mrp: 125.00 },
  { itemCode: 'FG-P-F-0247', description: 'PSM Frozen Chicken Salami 200g',                    quantity: 25,  unitRate: 137.52, mrp: 190.00 },
  { itemCode: 'FG-P-F-0102', description: 'PSM Frozen Pork Breakfast Bacon 150g',               quantity: 36,  unitRate: 152.00, mrp: 210.00 },
  { itemCode: 'FG-P-F-0321', description: 'PSM Frozen Sausage 250g',                           quantity: 380, unitRate: 130.29, mrp: 180.00 },
  { itemCode: 'FG-P-F-0581', description: 'PSM Whole Wheat Momos - Chicken 330g',              quantity: 80,  unitRate: 170.10, mrp: 235.00 },
  { itemCode: 'FG-P-F-0501', description: 'PSM FS Chef Momo - Chicken 1kg',                    quantity: 72,  unitRate: 247.62, mrp: 340.00 },
  { itemCode: 'FG-P-F-0564', description: 'PSM Cheese & Chicken Momos 540g',                   quantity: 25,  unitRate: 238.86, mrp: 330.00 },
];

async function seed() {
  console.log('[Seed] Connecting to MongoDB Atlas...');
  await connectDB();
  console.log('[Seed] Connected.\n');

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    SkuMaster.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    Grn.deleteMany({}),
    Invoice.deleteMany({}),
    MatchAudit.deleteMany({}),
  ]);
  console.log('[Seed] ✓ Cleared all collections.\n');

  // Insert SKU Master
  console.log('[Seed] Inserting SKU Master...');
  await SkuMaster.insertMany(realSkus);
  console.log(`[Seed] ✓ Inserted ${realSkus.length} SKU Master records.\n`);

  // Purchase Order
  const poNumber = 'CI4PO05788';
  const poDate = new Date('2026-03-17');

  console.log(`[Seed] Creating PO ${poNumber}...`);
  const { resolvedItems: resolvedPoItems } = await resolveDocumentItems(poItemsRaw);

  await PurchaseOrder.create({
    poNumber,
    poDate,
    vendorName: 'M/s AFP, GALA NO 5/17 AB, Mumbai, Maharashtra, India-400072',
    items: resolvedPoItems,
    rawParsed: {
      poNumber,
      poDate: '2026-03-17',
      vendorName: 'M/s AFP',
      gstin: '27ABACA2423J1Z0',
      pan: 'AAACA2423J',
      expectedDeliveryDate: '2026-04-02',
      poExpiryDate: '2026-04-04',
      paymentTerms: '0 Days',
      billingAddress: 'Cloudstore Retail Private Limited, B-400, One K-Square Park, Mumbai 421101',
      items: poItemsRaw,
    },
    filePath: '',
    fileName: 'CI4PO05788.pdf',
  });
  console.log(`[Seed] ✓ PO ${poNumber} created with ${resolvedPoItems.length} line items.\n`);

  // GRN
  const grnNumber = 'CI4000020234';
  const grnDate = new Date('2026-03-24');

  console.log(`[Seed] Creating GRN ${grnNumber}...`);
  const { resolvedItems: resolvedGrnItems } = await resolveDocumentItems(grnItemsRaw);

  await Grn.create({
    grnNumber,
    poNumber,
    grnDate,
    items: resolvedGrnItems,
    rawParsed: {
      grnNumber,
      poNumber,
      grnDate: '2026-03-24',
      inboundNumber: 'CI4000020359',
      invoiceNumber: 'IN25MH2504251',
      invoiceDate: '2026-03-24',
      vendor: 'M/s AFP',
      buyer: 'Cloudstore Retail Private Limited',
      buyerGstin: '27AAKCC0172C1Z1',
      expectedQty: 5345,
      receivedQty: 4705,
      items: grnItemsRaw,
    },
    filePath: '',
    fileName: 'CI4000020234.pdf',
  });
  console.log(`[Seed] ✓ GRN ${grnNumber} created with ${resolvedGrnItems.length} line items.\n`);

  // Invoice
  const invoiceNumber = 'IN25MH2504251';
  const invoiceDate = new Date('2026-03-24');

  console.log(`[Seed] Creating Invoice ${invoiceNumber}...`);
  const { resolvedItems: resolvedInvoiceItems } = await resolveDocumentItems(invoiceItemsRaw);

  const taxableTotal = invoiceItemsRaw.reduce((sum, i) => sum + (i.quantity * i.unitRate), 0);
  const cgst = taxableTotal * 0.025;
  const sgst = taxableTotal * 0.025;
  const total = taxableTotal + cgst + sgst;

  await Invoice.create({
    invoiceNumber,
    poNumber,
    invoiceDate,
    items: resolvedInvoiceItems,
    rawParsed: {
      invoiceNumber,
      poNumber,
      invoiceDate: '2026-03-24',
      vendor: 'M/s AFP',
      vendorGstin: '27ABACA2423J1Z0',
      buyer: 'Cloudstore Retail Private Limited',
      buyerGstin: '27AAKCC0172C1Z1',
      taxableValue: Number(taxableTotal.toFixed(2)),
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      totalAmount: Number(total.toFixed(2)),
      items: invoiceItemsRaw,
    },
    filePath: '',
    fileName: 'IN25MH2504251.pdf',
  });
  console.log(`[Seed] ✓ Invoice ${invoiceNumber} created with ${resolvedInvoiceItems.length} line items.\n`);

  await MatchAudit.create({
    poNumber,
    steps: [
      { step: 'REAL_DATA_SEEDED', status: 'SUCCESS', message: 'Accurately resolved 28 real SKU Master lines and PO/GRN/Invoice documents.' },
    ],
  });

  console.log('=== REAL DATA SEED COMPLETED SUCCESSFULLY ===\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
