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

// CORS Configuration
const allowedOrigins = [
  'https://rpruthvi785-alt.github.io',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach((o) => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL.trim())) {
  allowedOrigins.push(process.env.FRONTEND_URL.trim());
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      /^https:\/\/[a-zA-Z0-9-]+\.github\.io$/.test(origin) ||
      /^http:\/\/localhost:[0-9]+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:[0-9]+$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS Error: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
};

// Security & Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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

// Mount routes at both root and /api prefixes for maximum client compatibility
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/documents', documentRoutes);
app.use('/api/documents', documentRoutes);

app.use('/masters', skuRoutes);
app.use('/api/masters', skuRoutes);

app.use('/match', matchRoutes);
app.use('/api/match', matchRoutes);

app.use('/summary', summaryRoutes);
app.use('/api/summary', summaryRoutes);

// Protected token verification endpoint
const verifyHandler = (req, res) => {
  res.status(200).json({
    valid: true,
    user: req.user,
  });
};
app.get('/auth/verify', authMiddleware, verifyHandler);
app.get('/api/auth/verify', authMiddleware, verifyHandler);

const mongoose = require('mongoose');

// Standard Health check handler (available at both /health and /api/health)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'three-way-match-backend',
    timestamp: new Date().toISOString(),
    database: {
      type: 'mongodb',
      status: mongoose.connection.readyState === 1 ? 'connected' : 'ready',
      host: mongoose.connection.host || 'cluster0.oyvyyzi.mongodb.net',
    },
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Root entrypoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Three-Way Match Engine API',
    status: 'running',
    health: '/api/health',
    docs: '/api-docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      documents: '/api/documents',
      match: '/api/match/:poNumber',
      summary: '/api/summary/:poNumber',
      skuMaster: '/api/masters/sku',
    },
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    console.error(`[Server Error ${statusCode}]`, err);
  }

  res.status(statusCode).json({
    error: message,
    statusCode,
  });
});

module.exports = app;
