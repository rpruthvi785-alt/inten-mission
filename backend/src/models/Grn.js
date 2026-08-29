const mongoose = require('mongoose');

const grnItemSchema = new mongoose.Schema(
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
    receivedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      default: null,
    },
    skuMaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkuMaster',
      default: null,
    },
  },
  { _id: true }
);

const grnSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      required: [true, 'grnNumber is required'],
      trim: true,
      index: true,
    },
    poNumber: {
      type: String,
      required: [true, 'poNumber is required'],
      trim: true,
      index: true,
    },
    grnDate: {
      type: Date,
      default: null,
    },
    items: [grnItemSchema],
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

const Grn = mongoose.model('Grn', grnSchema);

module.exports = Grn;
