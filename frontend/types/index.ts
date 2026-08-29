export interface SkuMaster {
  _id?: string;
  skuErpCode: string;
  name: string;
  eanCode?: string;
  hsnCode?: string;
  uom?: string;
  agreedRate?: number | null;
  mrp?: number | null;
  priceTolerance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentItem {
  _id?: string;
  itemCode: string;
  description?: string;
  quantity?: number;
  receivedQuantity?: number;
  unitRate?: number | null;
  mrp?: number | null;
  skuMaster?: SkuMaster | string | null;
}

export interface PurchaseOrderDoc {
  _id: string;
  poNumber: string;
  poDate?: string;
  vendorName?: string;
  items: DocumentItem[];
  rawParsed?: any;
  filePath?: string;
  fileName?: string;
  createdAt?: string;
}

export interface GrnDoc {
  _id: string;
  grnNumber: string;
  poNumber: string;
  grnDate?: string;
  items: DocumentItem[];
  rawParsed?: any;
  filePath?: string;
  fileName?: string;
  createdAt?: string;
}

export interface InvoiceDoc {
  _id: string;
  invoiceNumber: string;
  poNumber: string;
  invoiceDate?: string;
  items: DocumentItem[];
  rawParsed?: any;
  filePath?: string;
  fileName?: string;
  createdAt?: string;
}

export interface MatchItem {
  sku: string;
  skuName: string;
  erpCode: string;
  eanCode: string;
  hsnCode: string;
  uom: string;
  poQty: number;
  grnQty: number;
  invoiceQty: number;
  pendingQty: number;
  agreedRate: number | null;
  invoiceRate: number | null;
  mrp: number | null;
  reasons: string[];
  warnings?: MatchWarning[];
  status?: string;
}

export type MatchStatus = 'matched' | 'partially_matched' | 'mismatch' | 'insufficient_documents';

export interface MatchConflict {
  code: string;
  title: string;
  description: string;
  resolution: string;
  details?: any;
}

export interface MatchWarning {
  code: string;
  sku?: string;
  skuName?: string;
  poQty?: number;
  grnQty?: number;
  invoiceQty?: number;
  variance?: number;
  tolerance?: number;
  status?: string;
  message?: string;
}

export interface DateFlowInfo {
  poDate: string;
  invoiceDate: string;
  differenceDays: number;
  isValidChronological: boolean;
}

export interface MatchResult {
  poNumber: string;
  status: MatchStatus;
  statusLabel?: string;
  reasons: string[];
  conflicts?: MatchConflict[];
  warnings?: MatchWarning[];
  dateFlow?: DateFlowInfo;
  config?: {
    quantityTolerance: number;
    mrpTolerancePercent: number;
  };
  documents: {
    po?: PurchaseOrderDoc | null;
    pos?: PurchaseOrderDoc[];
    grns?: GrnDoc[];
    invoices?: InvoiceDoc[];
  };
  items: MatchItem[];
}

export interface PoSummary {
  poNumber: string;
  poAmount: number;
  totalInvoiced: number;
  totalReceived: number;
  cumulativePoQty: number;
  cumulativeReceivedQty: number;
  cumulativeInvoicedQty: number;
  pendingDelivery: number;
  currentStatus: MatchStatus;
  reasons: string[];
  linkedDocuments: {
    poCount: number;
    grnCount: number;
    invoiceCount: number;
    pos: Array<{ id: string; poNumber: string; date?: string; vendor?: string }>;
    grns: Array<{ id: string; grnNumber: string; date?: string; itemCount: number }>;
    invoices: Array<{ id: string; invoiceNumber: string; date?: string; itemCount: number }>;
  };
  auditHistory: Array<{
    _id?: string;
    poNumber: string;
    steps: Array<{ step: string; status: string; message: string; at: string }>;
    createdAt: string;
  }>;
}

export type ActiveTab = 'po' | 'fulfillment' | 'delivery' | 'summary';
