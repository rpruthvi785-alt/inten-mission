-- ==============================================================================
-- THREE-WAY MATCH ENGINE - SUPABASE POSTGRESQL SCHEMA
-- Project URL: https://ovnpfbbhnpczawcnsynt.supabase.co
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type VARCHAR(50) NOT NULL, -- 'po', 'grn', 'invoice'
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT,
    po_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PROCESSED',
    extracted_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_po_number ON public.documents(po_number);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);

-- 2. PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    po_number VARCHAR(100) NOT NULL UNIQUE,
    vendor_name VARCHAR(255),
    document_date TIMESTAMP WITH TIME ZONE,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_po_number ON public.purchase_orders(po_number);

-- 3. PURCHASE ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    description TEXT,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_items_sku ON public.purchase_order_items(sku);

-- 4. GOODS RECEIPTS (GRN / DELIVERY)
CREATE TABLE IF NOT EXISTS public.goods_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    po_number VARCHAR(100) NOT NULL,
    grn_number VARCHAR(100) NOT NULL,
    receipt_date TIMESTAMP WITH TIME ZONE,
    vendor_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grn_po_number ON public.goods_receipts(po_number);
CREATE INDEX IF NOT EXISTS idx_grn_number ON public.goods_receipts(grn_number);

-- 5. GOODS RECEIPT ITEMS
CREATE TABLE IF NOT EXISTS public.goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goods_receipt_id UUID REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    description TEXT,
    received_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
    mrp NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grn_items_sku ON public.goods_receipt_items(sku);

-- 6. INVOICES (FULFILLMENT)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    po_number VARCHAR(100) NOT NULL,
    invoice_date TIMESTAMP WITH TIME ZONE,
    vendor_name VARCHAR(255),
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_po_number ON public.invoices(po_number);
CREATE INDEX IF NOT EXISTS idx_invoice_number ON public.invoices(invoice_number);

-- 7. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    description TEXT,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    mrp NUMERIC(12, 2),
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_items_sku ON public.invoice_items(sku);

-- 8. SKU MASTER TABLE
CREATE TABLE IF NOT EXISTS public.sku_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_erp_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    ean_code VARCHAR(100),
    hsn_code VARCHAR(50),
    uom VARCHAR(20) DEFAULT 'NOS',
    agreed_rate NUMERIC(12, 2),
    mrp NUMERIC(12, 2),
    price_tolerance NUMERIC(5, 4) DEFAULT 0.0500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sku_erp_code ON public.sku_master(sku_erp_code);
CREATE INDEX IF NOT EXISTS idx_sku_ean_code ON public.sku_master(ean_code);

-- 9. MATCH RESULTS
CREATE TABLE IF NOT EXISTS public.match_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'INSUFFICIENT_DOCUMENTS', -- 'MATCHED', 'PARTIALLY_MATCHED', 'MISMATCH', 'INSUFFICIENT_DOCUMENTS'
    total_po_amount NUMERIC(15, 2) DEFAULT 0.00,
    total_invoice_amount NUMERIC(15, 2) DEFAULT 0.00,
    mismatch_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_results_po ON public.match_results(po_number);

-- 10. MATCH ITEMS (ITEM LEVEL DISCREPANCY AUDIT)
CREATE TABLE IF NOT EXISTS public.match_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_result_id UUID REFERENCES public.match_results(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    po_quantity NUMERIC(12, 3) DEFAULT 0,
    grn_quantity NUMERIC(12, 3) DEFAULT 0,
    invoice_quantity NUMERIC(12, 3) DEFAULT 0,
    po_rate NUMERIC(12, 2) DEFAULT 0,
    invoice_rate NUMERIC(12, 2) DEFAULT 0,
    quantity_status VARCHAR(50) DEFAULT 'MATCHED',
    rate_status VARCHAR(50) DEFAULT 'MATCHED',
    mismatch_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- STORAGE BUCKET CREATION (Run in Supabase SQL editor if not already created)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;
