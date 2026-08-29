const { z } = require('zod');

// Purchase Order Schema
const poItemSchema = z.object({
  itemCode: z.string().min(1, 'itemCode is required'),
  description: z.string().default(''),
  quantity: z.coerce.number().min(0, 'quantity must be a non-negative number'),
});

const purchaseOrderSchema = z.object({
  poNumber: z.string().min(1, 'poNumber is required'),
  poDate: z.string().nullable().optional(),
  vendorName: z.string().nullable().optional(),
  items: z.array(poItemSchema).min(1, 'PO must contain at least one item'),
});

// Goods Receipt Note (GRN) Schema
const grnItemSchema = z.object({
  itemCode: z.string().min(1, 'itemCode is required'),
  description: z.string().default(''),
  receivedQuantity: z.coerce.number().min(0, 'receivedQuantity must be a non-negative number'),
  mrp: z.coerce.number().nullable().optional(),
});

const grnSchema = z.object({
  grnNumber: z.string().min(1, 'grnNumber is required'),
  poNumber: z.string().min(1, 'poNumber is required'),
  grnDate: z.string().nullable().optional(),
  items: z.array(grnItemSchema).min(1, 'GRN must contain at least one item'),
});

// Invoice Schema
const invoiceItemSchema = z.object({
  itemCode: z.string().min(1, 'itemCode is required'),
  description: z.string().default(''),
  quantity: z.coerce.number().min(0, 'quantity must be a non-negative number'),
  unitRate: z.coerce.number().nullable().optional(),
  mrp: z.coerce.number().nullable().optional(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'invoiceNumber is required'),
  poNumber: z.string().min(1, 'poNumber is required'),
  invoiceDate: z.string().nullable().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must contain at least one item'),
});

const getValidatorForType = (type) => {
  const normalizedType = type?.toLowerCase()?.trim();
  switch (normalizedType) {
    case 'po':
    case 'purchaseorder':
    case 'purchase_order':
      return purchaseOrderSchema;
    case 'grn':
    case 'delivery':
      return grnSchema;
    case 'invoice':
    case 'fulfillment':
      return invoiceSchema;
    default:
      throw new Error(`Unsupported document type: ${type}. Expected 'po', 'grn', or 'invoice'`);
  }
};

module.exports = {
  purchaseOrderSchema,
  grnSchema,
  invoiceSchema,
  getValidatorForType,
};
