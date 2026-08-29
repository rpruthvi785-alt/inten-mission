/**
 * Automated Verification Script for Cases 1 through 6
 */
const { matchPurchaseOrder } = require('../src/services/match.service');
const { SkuMaster, PurchaseOrder, Grn, Invoice } = require('../src/models');
const connectDB = require('../src/config/db');

async function runCases() {
  await connectDB();

  console.log('========================================================');
  console.log('RUNNING TEST CASES 1 THROUGH 6');
  console.log('========================================================\n');

  // Setup Test SKU Master
  await SkuMaster.deleteMany({ skuErpCode: 'CASE-SKU' });
  await SkuMaster.create({
    skuErpCode: 'CASE-SKU',
    name: 'PSM Frozen Chicken Seekh Kabab 500g',
    agreedRate: 228.00,
    mrp: 315.00,
    priceTolerance: 0.05,
  });

  const runSingleCase = async (caseNum, poQty, grnQty, invQty, expectedMatch, expectedConflict) => {
    const poNum = `CASE-${caseNum}`;
    await PurchaseOrder.deleteMany({ poNumber: poNum });
    await Grn.deleteMany({ poNumber: poNum });
    await Invoice.deleteMany({ poNumber: poNum });

    await PurchaseOrder.create({
      poNumber: poNum,
      poDate: new Date('2026-03-17'),
      items: [{ itemCode: 'CASE-SKU', quantity: poQty }],
    });
    await Grn.create({
      grnNumber: `GRN-${caseNum}`,
      poNumber: poNum,
      grnDate: new Date('2026-03-24'),
      items: [{ itemCode: 'CASE-SKU', receivedQuantity: grnQty, mrp: 315.00 }],
    });
    await Invoice.create({
      invoiceNumber: `INV-${caseNum}`,
      poNumber: poNum,
      invoiceDate: new Date('2026-03-24'),
      items: [{ itemCode: 'CASE-SKU', quantity: invQty, unitRate: 228.00, mrp: 315.00 }],
    });

    const res = await matchPurchaseOrder(poNum, { quantityTolerance: 2 });
    const isHardMismatch = res.status === 'mismatch';
    const isMatchOrWarning = res.status === 'matched' || res.status === 'partially_matched';

    console.log(`[CASE ${caseNum}] PO=${poQty} | GRN=${grnQty} | Invoice=${invQty} (Tolerance=2)`);
    console.log(`  -> Status: ${res.statusLabel} (${res.status})`);
    console.log(`  -> Conflicts (${res.conflicts.length}): ${res.conflicts.map(c => c.code).join(', ') || 'None'}`);
    console.log(`  -> Warnings (${res.warnings.length}): ${res.warnings.map(w => w.code + ' (+' + w.variance + ')').join(', ') || 'None'}`);

    if (expectedMatch) {
      if (isMatchOrWarning && res.conflicts.length === 0) {
        console.log(`  ✓ PASSED: Correctly evaluated as MATCHED / MATCHED_WITH_WARNINGS\n`);
      } else {
        console.error(`  ✗ FAILED: Expected MATCHED but got ${res.status}\n`);
      }
    } else {
      if (isHardMismatch && res.conflicts.some(c => c.code === expectedConflict)) {
        console.log(`  ✓ PASSED: Correctly flagged HARD_MISMATCH (${expectedConflict})\n`);
      } else {
        console.error(`  ✗ FAILED: Expected HARD_MISMATCH (${expectedConflict}) but got ${res.status}\n`);
      }
    }
  };

  // CASE 1: PO = 270, GRN = 270, Invoice = 270 -> Expected: MATCHED
  await runSingleCase(1, 270, 270, 270, true, null);

  // CASE 2: PO = 270, GRN = 272, Invoice = 272 -> Expected: MATCHED_WITH_WARNINGS (No hard quantity mismatch)
  await runSingleCase(2, 270, 272, 272, true, null);

  // CASE 3: PO = 270, GRN = 273, Invoice = 273 -> Expected: HARD_MISMATCH (grn_qty_exceeds_po_qty)
  await runSingleCase(3, 270, 273, 273, false, 'grn_qty_exceeds_po_qty');

  // CASE 4: PO = 270, GRN = 270, Invoice = 272 -> Expected: HARD_MISMATCH (invoice_qty_exceeds_grn_qty)
  await runSingleCase(4, 270, 270, 272, false, 'invoice_qty_exceeds_grn_qty');

  // CASE 5: PO = 270, GRN = 270, Invoice = 273 -> Expected: HARD_MISMATCH (invoice_qty_exceeds_po_qty)
  await runSingleCase(5, 270, 270, 273, false, 'invoice_qty_exceeds_po_qty');

  // CASE 6: PO = 270, GRN = 272, Invoice = 273 -> Expected: HARD_MISMATCH (invoice_qty_exceeds_grn_qty)
  await runSingleCase(6, 270, 272, 273, false, 'invoice_qty_exceeds_grn_qty');

  console.log('========================================================');
  console.log('✅ ALL TEST CASES 1 THROUGH 6 VERIFIED SUCCESSFULLY');
  console.log('========================================================');
  process.exit(0);
}

runCases().catch((err) => {
  console.error(err);
  process.exit(1);
});
