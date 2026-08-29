const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ovnpfbbhnpczawcnsynt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents';

let supabase = null;

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key_here');
}

function getSupabaseClient() {
  if (!supabase && isSupabaseConfigured()) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log(`[Supabase] Client initialized for project ${SUPABASE_URL}`);
    } catch (err) {
      console.warn(`[Supabase] Failed to initialize client: ${err.message}`);
      supabase = null;
    }
  }
  return supabase;
}

/**
 * Upload file to Supabase Storage bucket 'documents'
 */
async function uploadToStorage(filePath, destinationPath, mimeType = 'application/pdf') {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, storagePath: null, error: 'Supabase not configured' };
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const cleanDestination = destinationPath.replace(/\\/g, '/').replace(/^\/+/, '');

    const { data, error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(cleanDestination, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn(`[Supabase Storage] Upload warning: ${error.message}`);
      return { success: false, storagePath: null, error: error.message };
    }

    const { data: publicData } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(cleanDestination);

    return {
      success: true,
      storagePath: data?.path || cleanDestination,
      publicUrl: publicData?.publicUrl || null,
    };
  } catch (err) {
    console.warn(`[Supabase Storage] Error: ${err.message}`);
    return { success: false, storagePath: null, error: err.message };
  }
}

/**
 * Sync document metadata and parsed records into Supabase PostgreSQL
 */
async function syncDocumentToSupabase(documentType, docRecord, rawParsed = null) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const poNumber = docRecord.poNumber || rawParsed?.poNumber || null;

    // 1. Insert into documents table
    const { data: docRow, error: docError } = await client
      .from('documents')
      .upsert(
        {
          document_type: documentType.toLowerCase(),
          file_name: docRecord.fileName || 'uploaded-doc',
          storage_path: docRecord.storagePath || docRecord.filePath || '',
          po_number: poNumber,
          status: 'PROCESSED',
          extracted_data: rawParsed || docRecord.rawParsed || docRecord,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (docError) {
      console.warn(`[Supabase DB] Error syncing to documents table: ${docError.message}`);
    }

    const docId = docRow?.id || null;

    // 2. Sync specialized tables
    if (documentType === 'po' || documentType === 'purchaseorder') {
      const { data: poRow } = await client
        .from('purchase_orders')
        .upsert({
          document_id: docId,
          po_number: poNumber,
          vendor_name: docRecord.vendorName || rawParsed?.vendorName || '',
          document_date: docRecord.poDate ? new Date(docRecord.poDate).toISOString() : null,
          total_amount: docRecord.items?.reduce((sum, it) => sum + (it.quantity * (it.agreedRate || 0)), 0) || 0,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (poRow?.id && docRecord.items?.length > 0) {
        const poItems = docRecord.items.map((it) => ({
          purchase_order_id: poRow.id,
          sku: it.itemCode || it.sku || '',
          description: it.description || '',
          quantity: Number(it.quantity) || 0,
          unit_price: Number(it.agreedRate) || 0,
          total_amount: (Number(it.quantity) || 0) * (Number(it.agreedRate) || 0),
        }));
        await client.from('purchase_order_items').insert(poItems);
      }
    } else if (documentType === 'grn' || documentType === 'delivery') {
      const { data: grnRow } = await client
        .from('goods_receipts')
        .upsert({
          document_id: docId,
          po_number: poNumber,
          grn_number: docRecord.grnNumber || rawParsed?.grnNumber || '',
          receipt_date: docRecord.grnDate ? new Date(docRecord.grnDate).toISOString() : null,
          vendor_name: docRecord.vendorName || '',
        })
        .select()
        .single();

      if (grnRow?.id && docRecord.items?.length > 0) {
        const grnItems = docRecord.items.map((it) => ({
          goods_receipt_id: grnRow.id,
          sku: it.itemCode || it.sku || '',
          description: it.description || '',
          received_quantity: Number(it.receivedQuantity) || 0,
        }));
        await client.from('goods_receipt_items').insert(grnItems);
      }
    } else if (documentType === 'invoice' || documentType === 'fulfillment') {
      const { data: invRow } = await client
        .from('invoices')
        .upsert({
          document_id: docId,
          invoice_number: docRecord.invoiceNumber || rawParsed?.invoiceNumber || '',
          po_number: poNumber,
          invoice_date: docRecord.invoiceDate ? new Date(docRecord.invoiceDate).toISOString() : null,
          vendor_name: docRecord.vendorName || '',
          total_amount: docRecord.items?.reduce((sum, it) => sum + (it.quantity * (it.unitRate || 0)), 0) || 0,
        })
        .select()
        .single();

      if (invRow?.id && docRecord.items?.length > 0) {
        const invItems = docRecord.items.map((it) => ({
          invoice_id: invRow.id,
          sku: it.itemCode || it.sku || '',
          description: it.description || '',
          quantity: Number(it.quantity) || 0,
          unit_price: Number(it.unitRate) || 0,
          total_amount: (Number(it.quantity) || 0) * (Number(it.unitRate) || 0),
        }));
        await client.from('invoice_items').insert(invItems);
      }
    }

    return docRow;
  } catch (err) {
    console.warn(`[Supabase DB Sync] Exception: ${err.message}`);
    return null;
  }
}

/**
 * Sync Three-Way Match computation result to Supabase
 */
async function syncMatchResultToSupabase(poNumber, matchResult) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: matchRow, error } = await client
      .from('match_results')
      .upsert({
        po_number: poNumber,
        status: matchResult.status?.toUpperCase() || 'INSUFFICIENT_DOCUMENTS',
        total_po_amount: matchResult.summary?.poAmount || 0,
        total_invoice_amount: matchResult.summary?.totalInvoiced || 0,
        mismatch_count: matchResult.reasons?.length || 0,
      })
      .select()
      .single();

    if (matchRow?.id && matchResult.items?.length > 0) {
      const matchItems = matchResult.items.map((it) => ({
        match_result_id: matchRow.id,
        sku: it.sku || it.erpCode || '',
        po_quantity: Number(it.poQty) || 0,
        grn_quantity: Number(it.grnQty) || 0,
        invoice_quantity: Number(it.invoiceQty) || 0,
        po_rate: Number(it.agreedRate) || 0,
        invoice_rate: Number(it.invoiceRate) || 0,
        quantity_status: it.grnQty === it.poQty && it.invoiceQty === it.poQty ? 'MATCHED' : 'MISMATCH',
        rate_status: it.agreedRate === it.invoiceRate ? 'MATCHED' : 'MISMATCH',
        mismatch_reason: (it.reasons || []).join(', ') || null,
      }));

      await client.from('match_items').upsert(matchItems);
    }

    return matchRow;
  } catch (err) {
    console.warn(`[Supabase Match Sync] Error: ${err.message}`);
    return null;
  }
}

module.exports = {
  isSupabaseConfigured,
  getSupabaseClient,
  uploadToStorage,
  syncDocumentToSupabase,
  syncMatchResultToSupabase,
  SUPABASE_URL,
  STORAGE_BUCKET,
};
