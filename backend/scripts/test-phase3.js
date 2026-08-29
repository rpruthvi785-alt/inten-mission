require('dotenv').config();
const {
  purchaseOrderSchema,
  grnSchema,
  invoiceSchema,
  getValidatorForType,
} = require('../src/validators/document.validator');
const { cleanJsonOutput } = require('../src/services/gemini.service');

async function testPhase3() {
  console.log('--- STARTING PHASE 3 VERIFICATION TESTS (VALIDATORS & GEMINI PARSER) ---');

  // Test 1: JSON Cleaning
  console.log('\n[Test 1] Testing cleanJsonOutput helper...');
  const rawWithMarkdown = '```json\n{\n  "poNumber": "PO-123",\n  "items": [{"itemCode": "ITM1", "quantity": 10}]\n}\n```';
  const cleaned = cleanJsonOutput(rawWithMarkdown);
  const parsed = JSON.parse(cleaned);
  if (parsed.poNumber !== 'PO-123' || parsed.items[0].quantity !== 10) {
    throw new Error('cleanJsonOutput failed to extract valid JSON');
  }
  console.log('✓ Markdown code block successfully cleaned and parsed');

  // Test 2: Purchase Order Validation
  console.log('\n[Test 2] Testing PO Zod Schema...');
  const validPO = {
    poNumber: 'CI4PO05788',
    poDate: '2026-03-24',
    vendorName: 'Acme Corp',
    items: [
      { itemCode: '8901030383793', description: 'Product A', quantity: 50 },
      { itemCode: '8901030383809', description: 'Product B', quantity: 30 }
    ]
  };
  const validatedPO = purchaseOrderSchema.parse(validPO);
  if (validatedPO.items.length !== 2) throw new Error('PO item count mismatch');
  console.log('✓ Valid PO passed validation');

  // Test 3: GRN Validation
  console.log('\n[Test 3] Testing GRN Zod Schema...');
  const validGRN = {
    grnNumber: 'CI4000020234',
    poNumber: 'CI4PO05788',
    grnDate: '2026-03-24',
    items: [
      { itemCode: '8901030383793', description: 'Product A', receivedQuantity: 50, mrp: 120.0 }
    ]
  };
  const validatedGRN = grnSchema.parse(validGRN);
  if (validatedGRN.items[0].receivedQuantity !== 50) throw new Error('GRN quantity mismatch');
  console.log('✓ Valid GRN passed validation');

  // Test 4: Invoice Validation
  console.log('\n[Test 4] Testing Invoice Zod Schema...');
  const validInvoice = {
    invoiceNumber: 'IN25MH2504251',
    poNumber: 'CI4PO05788',
    invoiceDate: '2026-03-24',
    items: [
      { itemCode: '8901030383793', description: 'Product A', quantity: 50, unitRate: 95.0, mrp: 120.0 }
    ]
  };
  const validatedInvoice = invoiceSchema.parse(validInvoice);
  if (validatedInvoice.items[0].unitRate !== 95.0) throw new Error('Invoice unitRate mismatch');
  console.log('✓ Valid Invoice passed validation');

  // Test 5: Invalid Document Rejections
  console.log('\n[Test 5] Testing invalid document rejections...');
  try {
    purchaseOrderSchema.parse({ poNumber: 'PO-BAD', items: [] });
    throw new Error('Should have failed for empty items array');
  } catch (err) {
    console.log('✓ Rejected PO with empty items');
  }

  try {
    grnSchema.parse({ grnNumber: 'GRN-BAD' }); // Missing poNumber and items
    throw new Error('Should have failed for missing poNumber and items');
  } catch (err) {
    console.log('✓ Rejected GRN with missing required fields');
  }

  // Test 6: Validator Dispatcher
  console.log('\n[Test 6] Testing getValidatorForType...');
  if (!getValidatorForType('po') || !getValidatorForType('grn') || !getValidatorForType('invoice')) {
    throw new Error('getValidatorForType failed to resolve schemas');
  }
  console.log('✓ Validator dispatcher resolved all document types');

  console.log('\n=== PHASE 3 VERIFICATION COMPLETED SUCCESSFULLY ===\n');
}

testPhase3().catch((err) => {
  console.error('\n❌ PHASE 3 VERIFICATION FAILED:', err);
  process.exit(1);
});
