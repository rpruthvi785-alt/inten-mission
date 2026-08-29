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

const sampleSkus = [
  {
    skuErpCode: 'SKU-DOVE-SHMP-180',
    name: 'Dove Intense Repair Shampoo 180ml',
    eanCode: '8901030383793',
    hsnCode: '33051090',
    uom: 'NOS',
    agreedRate: 140.0,
    mrp: 175.0,
    priceTolerance: 0.05,
  },
  {
    skuErpCode: 'SKU-LUX-SOAP-100',
    name: 'Lux Velvet Glow Soap 100g',
    eanCode: '8901030383809',
    hsnCode: '34011110',
    uom: 'NOS',
    agreedRate: 38.5,
    mrp: 45.0,
    priceTolerance: 0.05,
  },
  {
    skuErpCode: 'SKU-COLGATE-MAX-150',
    name: 'Colgate MaxFresh Spicy Red Gel 150g',
    eanCode: '8901314010545',
    hsnCode: '33061020',
    uom: 'NOS',
    agreedRate: 92.0,
    mrp: 115.0,
    priceTolerance: 0.05,
  },
  {
    skuErpCode: 'SKU-SURF-EXCEL-1KG',
    name: 'Surf Excel Quick Wash Detergent Powder 1kg',
    eanCode: '8901030584916',
    hsnCode: '34029011',
    uom: 'NOS',
    agreedRate: 135.0,
    mrp: 160.0,
    priceTolerance: 0.05,
  },
  {
    skuErpCode: 'SKU-TATA-TEA-PREM-500',
    name: 'Tata Tea Premium 500g Pack',
    eanCode: '8901052002344',
    hsnCode: '09024020',
    uom: 'NOS',
    agreedRate: 210.0,
    mrp: 260.0,
    priceTolerance: 0.05,
  },
];

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDB();

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    SkuMaster.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    Grn.deleteMany({}),
    Invoice.deleteMany({}),
    MatchAudit.deleteMany({}),
  ]);

  console.log('[Seed] Inserting sample SKU Master items...');
  const createdSkus = await SkuMaster.insertMany(sampleSkus);
  console.log(`[Seed] ✓ Inserted ${createdSkus.length} SKU Master records.`);

  const poNumber = 'CI4PO05788';
  const poDate = new Date('2026-03-24');

  // Sample PO items
  const poItemsRaw = [
    { itemCode: '8901030383793', description: 'Dove Intense Repair Shampoo 180ml', quantity: 50 },
    { itemCode: '8901030383809', description: 'Lux Velvet Glow Soap 100g', quantity: 100 },
    { itemCode: '8901314010545', description: 'Colgate MaxFresh Spicy Red Gel 150g', quantity: 40 },
  ];
  const { resolvedItems: resolvedPoItems } = await resolveDocumentItems(poItemsRaw);

  const poDoc = await PurchaseOrder.create({
    poNumber,
    poDate,
    vendorName: 'Hindustan Consumer Supplies Ltd',
    items: resolvedPoItems,
    rawParsed: { poNumber, poDate: '2026-03-24', vendorName: 'Hindustan Consumer Supplies Ltd', items: poItemsRaw },
    filePath: 'uploads/sample-po.pdf',
    fileName: 'sample-po.pdf',
  });
  console.log(`[Seed] ✓ Created Purchase Order: ${poDoc.poNumber}`);

  // Sample GRN
  const grnNumber = 'CI4000020234';
  const grnDate = new Date('2026-03-24');
  const grnItemsRaw = [
    { itemCode: '8901030383793', description: 'Dove Intense Repair Shampoo 180ml', receivedQuantity: 50, mrp: 175.0 },
    { itemCode: '8901030383809', description: 'Lux Velvet Glow Soap 100g', receivedQuantity: 100, mrp: 45.0 },
    { itemCode: '8901314010545', description: 'Colgate MaxFresh Spicy Red Gel 150g', receivedQuantity: 40, mrp: 115.0 },
  ];
  const { resolvedItems: resolvedGrnItems } = await resolveDocumentItems(grnItemsRaw);

  const grnDoc = await Grn.create({
    grnNumber,
    poNumber,
    grnDate,
    items: resolvedGrnItems,
    rawParsed: { grnNumber, poNumber, grnDate: '2026-03-24', items: grnItemsRaw },
    filePath: 'uploads/sample-grn.pdf',
    fileName: 'sample-grn.pdf',
  });
  console.log(`[Seed] ✓ Created GRN: ${grnDoc.grnNumber}`);

  // Sample Invoice
  const invoiceNumber = 'IN25MH2504251';
  const invoiceDate = new Date('2026-03-24');
  const invoiceItemsRaw = [
    { itemCode: '8901030383793', description: 'Dove Intense Repair Shampoo 180ml', quantity: 50, unitRate: 140.0, mrp: 175.0 },
    { itemCode: '8901030383809', description: 'Lux Velvet Glow Soap 100g', quantity: 100, unitRate: 38.5, mrp: 45.0 },
    { itemCode: '8901314010545', description: 'Colgate MaxFresh Spicy Red Gel 150g', quantity: 40, unitRate: 92.0, mrp: 115.0 },
  ];
  const { resolvedItems: resolvedInvoiceItems } = await resolveDocumentItems(invoiceItemsRaw);

  const invoiceDoc = await Invoice.create({
    invoiceNumber,
    poNumber,
    invoiceDate,
    items: resolvedInvoiceItems,
    rawParsed: { invoiceNumber, poNumber, invoiceDate: '2026-03-24', items: invoiceItemsRaw },
    filePath: 'uploads/sample-invoice.pdf',
    fileName: 'sample-invoice.pdf',
  });
  console.log(`[Seed] ✓ Created Invoice: ${invoiceDoc.invoiceNumber}`);

  // Create Initial MatchAudit
  await MatchAudit.create({
    poNumber,
    steps: [
      { step: 'SEED_DATA_INITIALIZED', status: 'SUCCESS', message: 'Seed PO, GRN, and Invoice successfully inserted.' },
    ],
  });

  console.log('\n=== SEED COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
