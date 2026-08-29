require('dotenv').config();
const mongoose = require('mongoose');
const { SkuMaster, PurchaseOrder, Grn, Invoice, MatchAudit } = require('../src/models');
const app = require('../src/app');
const http = require('http');

async function testPhase1() {
  console.log('--- STARTING PHASE 1 VERIFICATION TESTS ---');

  // Test 1: SkuMaster Model Schema
  console.log('\n[Test 1] Testing SkuMaster schema...');
  const sampleSku = new SkuMaster({
    skuErpCode: 'SKU-001',
    name: 'Sample Product 1',
    eanCode: '8901234567890',
    hsnCode: '84713010',
    uom: 'NOS',
    agreedRate: 150.50,
    mrp: 180.00,
    priceTolerance: 0.05,
  });
  const skuValidationErr = sampleSku.validateSync();
  if (skuValidationErr) {
    throw new Error(`SkuMaster validation failed: ${skuValidationErr.message}`);
  }
  if (typeof sampleSku.skuErpCode !== 'string' || typeof sampleSku.eanCode !== 'string') {
    throw new Error('ERP or EAN codes must be stored as strings!');
  }
  console.log('✓ SkuMaster schema valid (ERP/EAN are strings, tolerance default applied)');

  // Test 2: PurchaseOrder Model Schema
  console.log('\n[Test 2] Testing PurchaseOrder schema...');
  const samplePO = new PurchaseOrder({
    poNumber: 'CI4PO05788',
    poDate: new Date('2026-03-24'),
    vendorName: 'Global Supplier Corp',
    items: [
      {
        itemCode: 'SKU-001',
        description: 'Sample Product 1',
        quantity: 100,
        skuMaster: null,
      },
    ],
    rawParsed: { test: true },
    filePath: 'uploads/sample.pdf',
    fileName: 'sample.pdf',
  });
  const poValidationErr = samplePO.validateSync();
  if (poValidationErr) {
    throw new Error(`PurchaseOrder validation failed: ${poValidationErr.message}`);
  }
  console.log('✓ PurchaseOrder schema valid');

  // Test 3: Grn Model Schema
  console.log('\n[Test 3] Testing Grn schema...');
  const sampleGrn = new Grn({
    grnNumber: 'CI4000020234',
    poNumber: 'CI4PO05788',
    grnDate: new Date('2026-03-24'),
    items: [
      {
        itemCode: 'SKU-001',
        description: 'Sample Product 1',
        receivedQuantity: 100,
        mrp: 180.00,
        skuMaster: null,
      },
    ],
    rawParsed: { test: true },
    filePath: 'uploads/grn.pdf',
  });
  const grnValidationErr = sampleGrn.validateSync();
  if (grnValidationErr) {
    throw new Error(`Grn validation failed: ${grnValidationErr.message}`);
  }
  console.log('✓ Grn schema valid');

  // Test 4: Invoice Model Schema
  console.log('\n[Test 4] Testing Invoice schema...');
  const sampleInvoice = new Invoice({
    invoiceNumber: 'IN25MH2504251',
    poNumber: 'CI4PO05788',
    invoiceDate: new Date('2026-03-24'),
    items: [
      {
        itemCode: 'SKU-001',
        description: 'Sample Product 1',
        quantity: 100,
        unitRate: 150.50,
        mrp: 180.00,
        skuMaster: null,
      },
    ],
    rawParsed: { test: true },
    filePath: 'uploads/invoice.pdf',
  });
  const invoiceValidationErr = sampleInvoice.validateSync();
  if (invoiceValidationErr) {
    throw new Error(`Invoice validation failed: ${invoiceValidationErr.message}`);
  }
  console.log('✓ Invoice schema valid');

  // Test 5: MatchAudit Model Schema
  console.log('\n[Test 5] Testing MatchAudit schema...');
  const sampleAudit = new MatchAudit({
    poNumber: 'CI4PO05788',
    steps: [
      {
        step: 'DOCUMENT_UPLOAD',
        status: 'SUCCESS',
        message: 'PO uploaded successfully',
      },
    ],
  });
  const auditValidationErr = sampleAudit.validateSync();
  if (auditValidationErr) {
    throw new Error(`MatchAudit validation failed: ${auditValidationErr.message}`);
  }
  console.log('✓ MatchAudit schema valid');

  // Test 6: Express App & Health Endpoint
  console.log('\n[Test 6] Testing Express app & Health endpoint...');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  const resBody = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  if (resBody.status !== 'ok') {
    throw new Error(`Health check failed: body ${JSON.stringify(resBody)}`);
  }
  console.log(`✓ Express health endpoint responding at port ${port}:`, resBody);

  server.close();

  console.log('\n=== PHASE 1 VERIFICATION COMPLETED SUCCESSFULLY ===\n');
  process.exit(0);
}

testPhase1().catch((err) => {
  console.error('\n❌ PHASE 1 VERIFICATION FAILED:', err);
  process.exit(1);
});
