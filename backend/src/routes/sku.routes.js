const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  getSkus,
  createSku,
  updateSku,
  deleteSku,
} = require('../controllers/sku.controller');

router.use(authMiddleware);

// GET /masters/sku
router.get('/sku', getSkus);

// POST /masters/sku
router.post('/sku', createSku);

// PATCH /masters/sku/:id
router.patch('/sku/:id', updateSku);

// DELETE /masters/sku/:id
router.delete('/sku/:id', deleteSku);

module.exports = router;
