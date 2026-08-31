require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { SkuMaster, PurchaseOrder, Grn, Invoice, MatchAudit } = require('./models');
const { resolveDocumentItems } = require('./services/sku.service');

const PORT = process.env.PORT || 5000;

const autoSeedIfEmpty = async () => {
  try {
    const po = await PurchaseOrder.findOne({ poNumber: 'CI4PO05788' });
    if (!po) {
      console.log('[Server] Auto-seeding CI4PO05788 with full PO, GRN, and Invoice documents...');
      const seedScript = require('../scripts/seed-real');
    }
  } catch (err) {
    console.warn('[Server Warning] Could not auto-seed:', err.message);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await autoSeedIfEmpty();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Three-Way Match Engine backend running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error(`[Server Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
