const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitRate: {
      type: Number,
      default: null,
      min: 0,
    },
    mrp: {
      type: Number,
      default: null,
      min: 0,
    },
    skuMaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkuMaster',
      default: null,
    },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'invoiceNumber is required'],
      trim: true,
      index: true,
    },
    poNumber: {
      type: String,
      required: [true, 'poNumber is required'],
      trim: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      default: null,
    },
    items: [invoiceItemSchema],
    rawParsed: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    filePath: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
