require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { SkuMaster, PurchaseOrder, Grn, Invoice, MatchAudit } = require('./models');
const { resolveDocumentItems } = require('./services/sku.service');

const PORT = process.env.PORT || 5000;

const autoSeedIfEmpty = async () => {
  try {
    const skuCount = await SkuMaster.countDocuments();
    if (skuCount === 0) {
      console.log('[Server] Auto-seeding initial SKU Master and sample documents...');
      
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

      await SkuMaster.insertMany(sampleSkus);

      const poNumber = 'CI4PO05788';
      const poItemsRaw = [
        { itemCode: '8901030383793', description: 'Dove Intense Repair Shampoo 180ml', quantity: 50 },
        { itemCode: '8901030383809', description: 'Lux Velvet Glow Soap 100g', quantity: 100 },
        { itemCode: '8901314010545', description: 'Colgate MaxFresh Spicy Red Gel 150g', quantity: 40 },
      ];
      const { resolvedItems: resolvedPoItems } = await resolveDocumentItems(poItemsRaw);

      await PurchaseOrder.create({
        poNumber,
        poDate: new Date('2026-03-24'),
        vendorName: 'Hindustan Consumer Supplies Ltd',
        items: resolvedPoItems,
        rawParsed: { poNumber, poDate: '2026-03-24', vendorName: 'Hindustan Consumer Supplies Ltd', items: poItemsRaw },
        filePath: 'uploads/sample-po.pdf',
        fileName: 'PurchaseOrder_CI4PO05788.pdf',
      });

      const grnItemsRaw = [
        { itemCode: '8901030383793', description: 'Dove Intense Repair Shampoo 180ml', receivedQuantity: 50, mrp: 175.0 },
        { itemCode: '8901030383809', description: 'Lux Velvet Glow Soap 100g', receivedQuantity: 100, mrp: 45.0 },
        { itemCode: '8901314010545', description: 'Colgate MaxFresh Spicy Red Gel 150g', receivedQuantity: 40, mrp: 115.0 },
      ];
      const { resolvedItems: resolvedGrnItems } = await resolveDocumentItems(grnItemsRaw);

      await Grn.create({
        grnNumber: 'CI4000020234',
        poNumber,
        grnDate: new Date('2026-03-24'),
        items: resolvedGrnItems,
        rawParsed: { grnNumber: 'CI4000020234', poNumber, grnDate: '2026-03-24', items: grnItemsRaw },
        filePath: 'uploads/sample-grn.pdf',
        fileName: 'GRN_CI4000020234.pdf',
      });

      const invoiceItemsRaw = [
        { itemCode: '8901030383793', description: 'Dove Intense Repair Shampoo 180ml', quantity: 50, unitRate: 140.0, mrp: 175.0 },
        { itemCode: '8901030383809', description: 'Lux Velvet Glow Soap 100g', quantity: 100, unitRate: 38.5, mrp: 45.0 },
        { itemCode: '8901314010545', description: 'Colgate MaxFresh Spicy Red Gel 150g', quantity: 40, unitRate: 92.0, mrp: 115.0 },
      ];
      const { resolvedItems: resolvedInvoiceItems } = await resolveDocumentItems(invoiceItemsRaw);

      await Invoice.create({
        invoiceNumber: 'IN25MH2504251',
        poNumber,
        invoiceDate: new Date('2026-03-24'),
        items: resolvedInvoiceItems,
        rawParsed: { invoiceNumber: 'IN25MH2504251', poNumber, invoiceDate: '2026-03-24', items: invoiceItemsRaw },
        filePath: 'uploads/sample-invoice.pdf',
        fileName: 'Invoice_IN25MH2504251.pdf',
      });

      await MatchAudit.create({
        poNumber,
        steps: [
          { step: 'INITIAL_SEED', status: 'SUCCESS', message: 'Preloaded sample PO, GRN, and Invoice.' },
        ],
      });

      console.log('[Server] ✓ Sample data ready.');
    }
  } catch (err) {
    console.warn('[Server Warning] Could not auto-seed:', err.message);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await autoSeedIfEmpty();

    app.listen(PORT, () => {
      console.log(`[Server] Three-Way Match Engine backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`[Server Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
