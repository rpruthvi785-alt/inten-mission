const mongoose = require('mongoose');

const skuMasterSchema = new mongoose.Schema(
  {
    skuErpCode: {
      type: String,
      required: [true, 'skuErpCode is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    eanCode: {
      type: String,
      trim: true,
      default: '',
    },
    hsnCode: {
      type: String,
      trim: true,
      default: '',
    },
    uom: {
      type: String,
      trim: true,
      default: 'NOS',
    },
    agreedRate: {
      type: Number,
      default: null,
      min: 0,
    },
    mrp: {
      type: Number,
      default: null,
      min: 0,
    },
    priceTolerance: {
      type: Number,
      default: 0.05, // 5% default tolerance
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for EAN resolution queries
skuMasterSchema.index({ eanCode: 1 });

const SkuMaster = mongoose.model('SkuMaster', skuMasterSchema);

module.exports = SkuMaster;
