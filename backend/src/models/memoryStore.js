const mongoose = require('mongoose');

class MemoryQuery {
  constructor(dataPromise) {
    this.dataPromise = dataPromise;
  }

  lean() {
    return this.dataPromise.then(res => JSON.parse(JSON.stringify(res)));
  }

  exec() {
    return this.dataPromise;
  }

  populate() {
    return this;
  }

  sort(sortCriteria) {
    return this;
  }

  limit(num) {
    return this;
  }

  then(resolve, reject) {
    return this.dataPromise.then(resolve, reject);
  }

  catch(reject) {
    return this.dataPromise.catch(reject);
  }
}

class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.data = [];
  }

  _filter(filter = {}) {
    return this.data.filter(item => {
      for (const [key, val] of Object.entries(filter)) {
        if (key === '$or' && Array.isArray(val)) {
          const matchedOr = val.some(condition => {
            return Object.entries(condition).every(([k, v]) => {
              if (v instanceof RegExp) return v.test(item[k] || '');
              return item[k] === v;
            });
          });
          if (!matchedOr) return false;
        } else if (val instanceof RegExp) {
          if (!val.test(item[key] || '')) return false;
        } else if (val && typeof val === 'object' && val.constructor.name === 'ObjectId') {
          if (String(item[key]) !== String(val)) return false;
        } else if (item[key] !== val) {
          return false;
        }
      }
      return true;
    });
  }

  find(filter = {}) {
    const promise = Promise.resolve(this._filter(filter));
    return new MemoryQuery(promise);
  }

  findOne(filter = {}) {
    const matched = this._filter(filter)[0] || null;
    const promise = Promise.resolve(matched ? { ...matched } : null);
    return new MemoryQuery(promise);
  }

  findById(id) {
    const item = this.data.find(d => String(d._id) === String(id)) || null;
    const promise = Promise.resolve(item ? { ...item } : null);
    return new MemoryQuery(promise);
  }

  async countDocuments(filter = {}) {
    return this._filter(filter).length;
  }

  async create(doc) {
    const _id = new mongoose.Types.ObjectId().toString();
    const newDoc = {
      ...doc,
      _id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.push(newDoc);
    return {
      ...newDoc,
      lean: () => ({ ...newDoc }),
    };
  }

  async insertMany(docs) {
    const created = [];
    for (const d of docs) {
      created.push(await this.create(d));
    }
    return created;
  }

  async findByIdAndUpdate(id, updates) {
    const index = this.data.findIndex(d => String(d._id) === String(id));
    if (index === -1) return null;
    this.data[index] = { ...this.data[index], ...updates, updatedAt: new Date() };
    return this.data[index];
  }

  async findByIdAndDelete(id) {
    const index = this.data.findIndex(d => String(d._id) === String(id));
    if (index === -1) return null;
    const removed = this.data.splice(index, 1)[0];
    return removed;
  }

  async deleteMany(filter = {}) {
    if (Object.keys(filter).length === 0) {
      const count = this.data.length;
      this.data = [];
      return { deletedCount: count };
    }
    const beforeCount = this.data.length;
    this.data = this.data.filter(item => {
      return !Object.entries(filter).every(([k, v]) => item[k] === v);
    });
    return { deletedCount: beforeCount - this.data.length };
  }
}

const memoryStores = {
  SkuMaster: new MemoryCollection('SkuMaster'),
  PurchaseOrder: new MemoryCollection('PurchaseOrder'),
  Grn: new MemoryCollection('Grn'),
  Invoice: new MemoryCollection('Invoice'),
  MatchAudit: new MemoryCollection('MatchAudit'),
};

module.exports = memoryStores;
