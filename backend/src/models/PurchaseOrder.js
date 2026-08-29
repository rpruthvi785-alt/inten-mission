const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema(
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
    skuMaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkuMaster',
      default: null,
    },
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: [true, 'poNumber is required'],
      trim: true,
      index: true,
    },
    poDate: {
      type: Date,
      default: null,
    },
    vendorName: {
      type: String,
      default: '',
      trim: true,
    },
    items: [poItemSchema],
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

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;
