const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getValidatorForType } = require('../validators/document.validator');

// Prompt definitions per document type
const PROMPTS = {
  po: `You are an expert OCR and procurement document extraction system.
Extract all structured data from this Purchase Order (PO) document.
Return ONLY a valid JSON object with EXACTLY the following structure (no other markdown or text):
{
  "poNumber": "string (The PO / Order Number)",
  "poDate": "string (ISO 8601 or YYYY-MM-DD or visible date, or null)",
  "vendorName": "string (Supplier / Vendor Name, or null)",
  "items": [
    {
      "itemCode": "string (Item code / SKU / Product Code / ERP Code / EAN as string)",
      "description": "string (Product description)",
      "quantity": number (Ordered quantity as number >= 0)
    }
  ]
}
Do not invent values. If a field is not visible, use null. Item codes must be strings. Return JSON only.`,

  grn: `You are an expert OCR and logistics document extraction system.
Extract all structured data from this Goods Receipt Note (GRN / Delivery / Inward receipt) document.
Return ONLY a valid JSON object with EXACTLY the following structure (no other markdown or text):
{
  "grnNumber": "string (The GRN or Inward Document Number)",
  "poNumber": "string (The referenced Purchase Order Number / PO No)",
  "grnDate": "string (Date of GRN / Receipt, or null)",
  "items": [
    {
      "itemCode": "string (Item code / SKU / Product Code / ERP Code / EAN as string)",
      "description": "string (Product description)",
      "receivedQuantity": number (Accepted/Received Quantity as number >= 0)",
      "mrp": number (Maximum retail price per unit if visible, else null)
    }
  ]
}
Do not invent values. If a field is not visible, use null. Item codes must be strings. Return JSON only.`,

  invoice: `You are an expert OCR and finance document extraction system.
Extract all structured data from this Tax Invoice / Commercial Invoice document.
Return ONLY a valid JSON object with EXACTLY the following structure (no other markdown or text):
{
  "invoiceNumber": "string (Invoice Number)",
  "poNumber": "string (The referenced Purchase Order Number / PO No / Order Ref)",
  "invoiceDate": "string (Date of Invoice, or null)",
  "items": [
    {
      "itemCode": "string (Item code / SKU / Product Code / ERP Code / EAN as string)",
      "description": "string (Product description)",
      "quantity": number (Invoiced / Billed Quantity as number >= 0)",
      "unitRate": number (Unit Price / Base Rate per unit, else null)",
      "mrp": number (MRP per unit if visible, else null)
    }
  ]
}
Do not invent values. If a field is not visible, use null. Item codes must be strings. Return JSON only.`
};

/**
 * Clean Gemini raw response to extract parseable JSON string
 */
function cleanJsonOutput(text) {
  if (!text) return '';
  let cleaned = text.trim();
  // Remove markdown code blocks ```json ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

/**
 * Convert local file to GenerativePart for Gemini API
 */
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType: mimeType || 'application/pdf',
    },
  };
}

/**
 * Parse document using Gemini API with retry and Zod validation
 */
async function parseDocumentWithGemini(filePath, documentType, mimeType) {
  const normalizedType = documentType.toLowerCase().trim();
  const validator = getValidatorForType(normalizedType);
  const promptKey = normalizedType.includes('po') ? 'po' : normalizedType.includes('grn') ? 'grn' : 'invoice';
  const prompt = PROMPTS[promptKey];

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    // If running in development without API key, inspect if text/mock parsing applies
    console.warn('[Gemini Service] No valid GEMINI_API_KEY detected. Check fallback parsing.');
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Default to gemini-1.5-flash or gemini-2.0-flash
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

  const filePart = fileToGenerativePart(filePath, mimeType);

  let attempts = 0;
  const maxAttempts = 2; // Retry once if malformed
  let lastError = null;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      let currentPrompt = prompt;
      if (attempts > 1 && lastError) {
        currentPrompt = `${prompt}\n\nIMPORTANT: Your previous output failed validation with error: "${lastError.message}". Please ensure you output strictly compliant JSON matching the schema with all required fields.`;
      }

      const result = await model.generateContent([currentPrompt, filePart]);
      const responseText = result.response.text();
      const cleanedJson = cleanJsonOutput(responseText);
      const parsedJson = JSON.parse(cleanedJson);

      // Validate schema
      const validatedData = validator.parse(parsedJson);
      return {
        data: validatedData,
        raw: parsedJson,
        rawText: responseText,
      };
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Service] Attempt ${attempts} failed: ${err.message}`);
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to parse document with Gemini after ${maxAttempts} attempts: ${err.message}`);
      }
    }
  }
}

module.exports = {
  parseDocumentWithGemini,
  cleanJsonOutput,
  PROMPTS,
};
