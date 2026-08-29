const mongoose = require('mongoose');
const SkuMasterModel = require('./SkuMaster');
const PurchaseOrderModel = require('./PurchaseOrder');
const GrnModel = require('./Grn');
const InvoiceModel = require('./Invoice');
const MatchAuditModel = require('./MatchAudit');
const memoryStores = require('./memoryStore');

function createModelProxy(mongooseModel, memoryCollection) {
  return new Proxy(mongooseModel, {
    get(target, prop) {
      // If Mongoose is connected to real MongoDB (readyState === 1), use real mongoose
      if (mongoose.connection.readyState === 1) {
        return target[prop];
      }
      // Otherwise, use memory collection fallback
      if (typeof memoryCollection[prop] === 'function') {
        return memoryCollection[prop].bind(memoryCollection);
      }
      return target[prop];
    },
  });
}

module.exports = {
  SkuMaster: createModelProxy(SkuMasterModel, memoryStores.SkuMaster),
  PurchaseOrder: createModelProxy(PurchaseOrderModel, memoryStores.PurchaseOrder),
  Grn: createModelProxy(GrnModel, memoryStores.Grn),
  Invoice: createModelProxy(InvoiceModel, memoryStores.Invoice),
  MatchAudit: createModelProxy(MatchAuditModel, memoryStores.MatchAudit),
};
