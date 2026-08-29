const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  getDocumentFile,
} = require('../controllers/document.controller');

// All document routes require authentication
router.use(authMiddleware);

// POST /documents/upload
router.post('/upload', upload.single('file'), uploadDocument);

// GET /documents?type=&poNumber=
router.get('/', getDocuments);

// GET /documents/:id
router.get('/:id', getDocumentById);

// GET /documents/:id/file
router.get('/:id/file', getDocumentFile);

module.exports = router;
