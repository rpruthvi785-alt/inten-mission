const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { getSummaryForPo } = require('../controllers/match.controller');

router.use(authMiddleware);

// GET /summary/:poNumber
router.get('/:poNumber', getSummaryForPo);

module.exports = router;
