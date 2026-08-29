const mongoose = require('mongoose');

const auditStepSchema = new mongoose.Schema(
  {
    step: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING', 'INFO'],
      default: 'INFO',
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const matchAuditSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: [true, 'poNumber is required'],
      trim: true,
      index: true,
    },
    steps: [auditStepSchema],
  },
  {
    timestamps: true,
  }
);

const MatchAudit = mongoose.model('MatchAudit', matchAuditSchema);

module.exports = MatchAudit;
