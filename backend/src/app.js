const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security & Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded files statically if needed (protected access handled via routes)
app.use('/uploads', express.static(uploadsDir));

// Routes
const authRoutes = require('./routes/auth.routes');
const documentRoutes = require('./routes/document.routes');
const skuRoutes = require('./routes/sku.routes');
const matchRoutes = require('./routes/match.routes');
const summaryRoutes = require('./routes/summary.routes');
const authMiddleware = require('./middleware/auth.middleware');

// Swagger API Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/masters', skuRoutes);
app.use('/match', matchRoutes);
app.use('/summary', summaryRoutes);

// Protected token verification endpoint
app.get('/auth/verify', authMiddleware, (req, res) => {
  res.status(200).json({
    valid: true,
    user: req.user,
  });
});

// Root entrypoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Three-Way Match Engine API',
    status: 'running',
    health: '/health',
    docs: '/api-docs',
    endpoints: {
      auth: '/auth/login',
      documents: '/documents',
      match: '/match/:poNumber',
      summary: '/summary/:poNumber',
      skuMaster: '/masters/sku'
    }
  });
});

const mongoose = require('mongoose');

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'three-way-match-engine-backend',
    database: {
      type: 'mongodb',
      status: mongoose.connection.readyState === 1 ? 'connected' : 'ready',
      host: mongoose.connection.host || 'cluster0.oyvyyzi.mongodb.net',
    }
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  // Never expose stack traces or secrets
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
  });
});

module.exports = app;
