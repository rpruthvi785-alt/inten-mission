const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { getMatchForPo } = require('../controllers/match.controller');

router.use(authMiddleware);

// GET /match/:poNumber
router.get('/:poNumber', getMatchForPo);

module.exports = router;
