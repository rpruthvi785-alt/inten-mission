# ⚡ Three-Way Match Engine

An automated, full-stack **Three-Way Match Reconciliation Engine** for **Purchase Orders (PO)**, **Goods Receipt Notes (GRN / Delivery)**, and **Invoices (Fulfillment)** powered by **Gemini OCR**, **Node.js/Express**, **MongoDB/Mongoose**, and **Next.js (App Router) + Tailwind CSS + TanStack Query**.

---

## 📋 Table of Contents
1. [Overview](#-overview)
2. [Architecture](#-architecture)
3. [Tech Stack & Justifications](#-tech-stack--justifications)
4. [Data Models & Schema Design](#-data-models--schema-design)
5. [Core Business Logic & Matching Rules](#-core-business-logic--matching-rules)
6. [Gemini Document Parsing & OCR Pipeline](#-gemini-document-parsing--ocr-pipeline)
7. [SKU Master Resolution Algorithm](#-sku-master-resolution-algorithm)
8. [Out-of-Order Upload & Duplicate Handling](#-out-of-order-upload--duplicate-handling)
9. [REST API Documentation & Endpoints](#-rest-api-documentation--endpoints)
10. [Getting Started & Local Setup](#-getting-started--local-setup)
11. [Running Tests & Verification](#-running-tests--verification)
12. [Assumptions, Tradeoffs & Limitations](#-assumptions-tradeoffs--limitations)

---

## 🔭 Overview

The **Three-Way Match Engine** provides enterprise reconciliation across procurement, warehouse delivery, and vendor billing:
- **Purchase Orders (PO):** The contractual commitment of items, quantities, and agreed unit rates.
- **Goods Receipt Notes (GRN / Delivery):** Physical items and quantities actually received and inspected at the warehouse.
- **Invoices (Fulfillment):** Vendor tax invoices billing for supplied goods and claiming payment.

The system ingests documents in **ANY upload order**, extracts line items using **Gemini Multimodal AI**, resolves SKU codes case-insensitively against a central **SKU Master**, executes 20+ reconciliation rules dynamically from current database records (never stale caches), and highlights discrepancies in a real-time Next.js dashboard.

---

## 🏗️ Architecture

```
three-way-match-engine/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection & standalone fallback
│   │   ├── controllers/     # Auth, Documents, SKU Master, Match & Summary
│   │   ├── middleware/      # Bearer Auth, Multer File Uploads, Centralized Errors
│   │   ├── models/          # SkuMaster, PurchaseOrder, Grn, Invoice, MatchAudit
│   │   ├── routes/          # REST route declarations & Swagger endpoint
│   │   ├── services/        # Gemini OCR, SKU Resolution, Three-Way Match Engine
│   │   ├── validators/      # Zod validation schemas for PO, GRN, and Invoices
│   │   ├── docs/            # OpenAPI / Swagger 3.0 specification
│   │   ├── app.js           # Express app definition & middleware pipeline
│   │   └── server.js        # Server listener entry point
│   ├── scripts/             # Automated test suites (Phase 1, 2, 3, and 20 Matching Rules)
│   ├── uploads/             # Local document storage
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── login/           # Authentication screen
│   │   ├── dashboard/       # Main Dashboard (Tabs: PO, Fulfillment, Delivery, Summary)
│   │   ├── masters/         # SKU Master Catalog CRUD Management
│   │   ├── layout.tsx       # Root layout with TanStack Query provider
│   │   └── globals.css      # Tailwind & Badge custom styles
│   ├── components/          # Navbar, TabsNavigation, ItemGrid, PdfViewer, SummaryCards, Modals
│   ├── lib/                 # Typed API client and TanStack Query client
│   ├── types/               # TypeScript interfaces
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
└── README.md
```

---

## 🛠️ Tech Stack & Justifications

### Backend
- **Node.js & Express:** Lightweight, fast, non-blocking I/O ideal for multipart document streaming and REST APIs.
- **MongoDB & Mongoose:** Flexible document database with string-enforced ERP/EAN fields and seamless raw Gemini payload storage. Includes a built-in memory store proxy for zero-friction local testing.
- **Google Generative AI (Gemini Flash):** Multimodal document parser extracting line items directly from PDF/Image uploads.
- **Multer:** Multipart file upload middleware with mime-type filtering (PDF, PNG, JPG, WEBP) and size limits.
- **Zod:** Runtime schema validation ensuring parsed Gemini JSON strictly satisfies line-item integrity before DB insertion.
- **Swagger UI (`swagger-ui-express`):** Interactive API documentation at `/api-docs`.

### Frontend
- **Next.js 14 (App Router) + TypeScript:** Robust component-driven framework with type-safe routing.
- **Tailwind CSS:** Responsive utility styling with custom color tokens for clean mismatch cell highlighting.
- **TanStack Query (React Query):** Chosen over Redux Toolkit because this dashboard is fundamentally **server-state driven**. TanStack Query provides automatic caching, background refetching upon document upload/SKU creation, request deduplication, and minimal boilerplate compared to Redux slice reducers.
- **Lucide React:** Clean icons for navigation and audit statuses.

---

## 🗄️ Data Models & Schema Design

### 1. `SkuMaster`
- `skuErpCode` (*String, unique, indexed*): Primary ERP identifier.
- `name` (*String*): Official SKU name.
- `eanCode` (*String, indexed*): EAN-13 or barcode string.
- `hsnCode` (*String*): HSN/SAC code.
- `uom` (*String*): Unit of measurement (e.g. `NOS`, `PCS`, `KG`).
- `agreedRate` (*Number*): Contracted unit price.
- `mrp` (*Number*): Maximum retail price.
- `priceTolerance` (*Number, default: 0.05*): Permitted price variance (e.g. 5%).

### 2. `PurchaseOrder`
- `poNumber` (*String, indexed*), `poDate` (*Date*), `vendorName` (*String*).
- `items`: Array of `{ itemCode, description, quantity, skuMaster (ref) }`.
- `rawParsed` (*Mixed*): Unmodified Gemini JSON output for auditing.
- `filePath`, `fileName`: Uploaded document reference.

### 3. `Grn` (Goods Receipt Note)
- `grnNumber` (*String, indexed*), `poNumber` (*String, indexed*), `grnDate` (*Date*).
- `items`: Array of `{ itemCode, description, receivedQuantity, mrp, skuMaster (ref) }`.

### 4. `Invoice`
- `invoiceNumber` (*String, indexed*), `poNumber` (*String, indexed*), `invoiceDate` (*Date*).
- `items`: Array of `{ itemCode, description, quantity, unitRate, mrp, skuMaster (ref) }`.

### 5. `MatchAudit`
- `poNumber` (*String, indexed*), `steps`: Array of `{ step, status, message, at }`.

> **Critical Rule:** ERP and EAN codes are strictly stored as `String` (never numbers) to preserve leading zeros and formatting.

---

## ⚙️ Core Business Logic & Matching Rules

Every call to `GET /match/:poNumber` dynamically recomputes against the **current database** state.

### Reason Codes & Classifications

| Reason Code | Type | Trigger Condition | Status Impact |
| :--- | :--- | :--- | :--- |
| `grn_qty_exceeds_po_qty` | **Hard** | Cumulative GRN received qty > PO ordered qty | `mismatch` |
| `invoice_qty_exceeds_grn_qty` | **Hard** | Cumulative Invoice billed qty > GRN received qty | `mismatch` |
| `invoice_qty_exceeds_po_qty` | **Hard** | Cumulative Invoice billed qty > PO ordered qty | `mismatch` |
| `invoice_date_after_po_date` | **Hard** | Invoice date is after PO date | `mismatch` |
| `duplicate_po` | **Hard** | More than one PO document exists for `poNumber` | `mismatch` |
| `duplicate_document` | **Hard** | Multiple GRNs or Invoices share same document number | `mismatch` |
| `item_missing_in_po` | **Hard** | GRN/Invoice item not present in Purchase Order | `mismatch` |
| `price_mismatch` | **Soft** | `abs(invoiceRate - agreedRate) / agreedRate > priceTolerance` | `partially_matched` |
| `mrp_mismatch` | **Soft** | `abs(mrp - skuMasterMrp) / skuMasterMrp > 0.01` (>1% variance) | `partially_matched` |
| `unmapped_master_sku` | **Soft** | Line item code not found in SKU Master | `partially_matched` |

### Reconciliation Status Hierarchy
1. **`insufficient_documents`**: Returned when the complete set (PO + GRN + Invoice) is not yet available.
2. **`mismatch`**: Returned when any **Hard Violation** exists.
3. **`partially_matched`**: Returned when no hard violations exist, but one or more **Soft Warnings** (price/MRP variance or unmapped SKU) exist.
4. **`matched`**: Returned ONLY when all 3 document types exist, quantities reconcile perfectly, and there are zero warnings.

---

## 🤖 Gemini Document Parsing & OCR Pipeline

1. **Upload Validation:** Multer verifies MIME type and file size.
2. **File Part Encoding:** Base64 binary payload sent to Gemini (`gemini-1.5-flash` / `gemini-2.0-flash`).
3. **Targeted Prompting:** Enforces strict JSON extraction matching PO, GRN, or Invoice structure.
4. **Markdown Sanitization:** Cleans ````json ... ```` formatting.
5. **Zod Validation:** Validates field types and positive quantities.
6. **Self-Correction Retry:** If malformed JSON is returned, the prompt is enriched with validation feedback and retried once before raising an error.

---

## 🔍 SKU Master Resolution Algorithm

For every extracted line item:
1. Trim all leading/trailing whitespace.
2. Perform **case-insensitive** exact match against `SkuMaster.skuErpCode`.
3. If not found, perform **case-insensitive** exact match against `SkuMaster.eanCode`.
4. If found: link `skuMaster` ObjectId reference.
5. If not found: keep `skuMaster = null`, use normalized `itemCode` as matching key fallback, and flag `unmapped_master_sku`.
6. **Late Resolution:** When a missing SKU is created later, `GET /match/:poNumber` automatically re-resolves and updates the status.

---

## 🔀 Out-of-Order Upload & Duplicate Handling

- **Any Order Supported:** Invoices and GRNs can be uploaded before POs. Status remains `insufficient_documents` until the full triad is uploaded.
- **Duplicate PO:** If a second PO for the same `poNumber` is uploaded, both are preserved (neither overwritten nor dropped) and flagged with `duplicate_po`.
- **Duplicate Document:** If duplicate GRN or Invoice numbers are uploaded under the same PO, both records are retained and flagged with `duplicate_document`.

---

## 📡 REST API Documentation & Endpoints

Interactive Swagger UI available at: `http://localhost:5000/api-docs`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Login and obtain static token | No |
| `GET` | `/auth/verify` | Verify current Bearer token | Yes |
| `POST` | `/documents/upload` | Upload & parse PO/GRN/Invoice | Yes |
| `GET` | `/documents` | List documents (filter by `type`, `poNumber`) | Yes |
| `GET` | `/documents/:id` | Get document details by ID | Yes |
| `GET` | `/documents/:id/file` | Stream original PDF/image for preview | Yes |
| `GET` | `/match/:poNumber` | Recompute dynamic Three-Way Match | Yes |
| `GET` | `/summary/:poNumber` | Get executive stats & linked documents | Yes |
| `GET` | `/masters/sku` | List SKU Master catalog | Yes |
| `POST` | `/masters/sku` | Create new SKU Master record | Yes |
| `PATCH` | `/masters/sku/:id` | Update SKU Master record | Yes |
| `DELETE` | `/masters/sku/:id` | Delete SKU Master record | Yes |

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js:** v18.x, v20.x, or v22+
- **MongoDB:** Local MongoDB daemon OR MongoDB Atlas URI (or automated in-memory fallback)

### 1. Backend Setup
```powershell
cd "backend"
copy .env.example .env
npm install
npm run seed       # Seeds sample SKU catalog and PO CI4PO05788
npm run dev        # Runs backend on http://localhost:5000
```

### 2. Frontend Setup
```powershell
cd "frontend"
npm install
npm run dev        # Runs frontend on http://localhost:3000
```

Open `http://localhost:3000` in your browser.
- **Username:** `admin`
- **Password:** `admin123`

---

## 🧪 Running Tests & Verification

The test suites verify all phases, schemas, and 20 business matching rules:

```powershell
cd "backend"

# Test Phase 1: Models & Schema integrity
node scripts/test-phase1.js

# Test Phase 2: Authentication & Protected routes
node scripts/test-phase2.js

# Test Phase 3: Zod validators & Gemini parsing
node scripts/test-phase3.js

# Test Phase 6 & 7: Complete 20 Matching Rules Suite
node scripts/test-phase6-7.js
```

### Verified Test Cases:
1. Normal matched PO/GRN/Invoice (`matched`)
2. Invoice uploaded before PO (Out-of-order)
3. GRN uploaded before PO (Out-of-order)
4. Missing PO (`insufficient_documents`)
5. Missing GRN (`insufficient_documents`)
6. Missing Invoice (`insufficient_documents`)
7. Duplicate PO (`duplicate_po`)
8. Duplicate GRN (`duplicate_document`)
9. Duplicate Invoice (`duplicate_document`)
10. Unmapped SKU (`unmapped_master_sku`)
11. GRN qty exceeds PO qty (`grn_qty_exceeds_po_qty`)
12. Invoice qty exceeds GRN qty (`invoice_qty_exceeds_grn_qty`)
13. Invoice qty exceeds PO qty (`invoice_qty_exceeds_po_qty`)
14. Invoice date after PO date (`invoice_date_after_po_date`)
15. Price mismatch exceeding tolerance (`price_mismatch`)
16. MRP mismatch exceeding 1% variance (`mrp_mismatch`)
17. Multiple lines containing same SKU (correct aggregation)
18. Zero/invalid agreed rate protection
19. Missing rate/MRP does not cause false mismatch
20. SKU Master created after document upload (dynamic re-resolution)

---

## ⚖️ Assumptions, Tradeoffs & Limitations

### Assumptions
1. **UOM Conversions:** Assumed to be out-of-scope per prompt specification. All quantities are compared in the same base unit (no unit-of-measure conversion is performed).
2. **Authentication:** A static demo Bearer token (`demo-static-token`) is used as specified by the assignment. In production, JWT or OAuth2 would replace this.
3. **File Storage:** Documents are stored on local disk at `backend/uploads/`. In production, S3 or GCS would be used.
4. **Tolerance Defaults:** Price tolerance defaults to `5%` (`0.05`) per SKU and MRP tolerance is fixed at `1%` (`0.01`).
5. **Multiple GRN/Invoice:** The engine supports cumulative quantities across multiple GRNs and Invoices for the same PO (with duplicate detection).
6. **Invoice Date Rule:** The `invoice_date_after_po_date` rule flags invoices dated strictly after the PO date as a violation, per assignment specification.
7. **Late SKU Creation:** SKU Master entries created after document upload will be correctly resolved on the next `GET /match/:poNumber` call — no re-upload is needed.

### Tradeoffs
- **Memory Store vs. MongoDB:** A built-in in-memory store is used as fallback when MongoDB is unavailable, enabling zero-config local development and all automated tests to pass without a live database.
- **Static Token Auth:** Simplifies setup while still demonstrating the auth middleware pattern. Real deployments must use signed JWTs.
- **No Pagination:** Document lists are returned in full. For production use cases with thousands of documents, cursor-based pagination would be required.

### Known Limitations
- Physical PDF files for pre-seeded sample documents (CI4PO05788, CI4000020234, IN25MH2504251) do not exist on disk. The PDF viewer shows a clear "Preview Unavailable" state rather than a broken iframe.
- Gemini extraction quality is dependent on document legibility. Blurry or handwritten documents may yield incomplete extractions.
- The in-memory store does not persist data across server restarts (by design for demo/testing). MongoDB is required for persistence.
- File type validation is MIME-type based. Maliciously renamed files are blocked by server-side MIME checking.

---

## 🌍 Environment Variables

Create `backend/.env` from `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/three_way_match_db
AUTH_TOKEN=demo-static-token
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
NODE_ENV=development
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port for Express server (default: 5000) |
| `MONGODB_URI` | No | MongoDB connection string. If unavailable, memory store is used |
| `AUTH_TOKEN` | No | Static bearer token for API authentication (default: `demo-static-token`) |
| `GEMINI_API_KEY` | **Yes** (for real PDF parsing) | Google Gemini API key from [Google AI Studio](https://aistudio.google.com) |
| `GEMINI_MODEL` | No | Gemini model name (default: `gemini-1.5-flash`) |
| `NODE_ENV` | No | Set to `production` to disable request logging |

> ⚠️ **Never commit your actual `GEMINI_API_KEY` to Git.** The `.env` file is in `.gitignore`.

---

## 🤖 Gemini API Setup

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create a new API key (free tier available).
3. Paste the key into `backend/.env` as `GEMINI_API_KEY=your_key_here`.
4. The system defaults to `gemini-1.5-flash`. You can switch to `gemini-2.0-flash` by setting `GEMINI_MODEL=gemini-2.0-flash`.

Without a Gemini API key, document uploads via the PDF/image upload modal will fail with an explanatory error. The backend will still work with pre-seeded data and the test suites (which use direct data injection, not Gemini).

---

## 🗄️ MongoDB Setup

The engine runs in **in-memory mode** if MongoDB is unreachable — no configuration required for local development and testing.

For persistent storage with MongoDB:

```bash
# Start local MongoDB (if installed)
mongod --dbpath ./data

# Or use MongoDB Atlas: set MONGODB_URI in .env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/three_way_match_db
```

---

## 🎛️ State Management

**Frontend** uses **TanStack Query (React Query v5)** for all server state:

| Query Key | Purpose |
|---|---|
| `['match', poNumber]` | Three-way match result — invalidated after upload |
| `['summary', poNumber]` | Executive summary — invalidated after upload |
| `['skus']` | SKU Master list — invalidated after create/update/delete |

TanStack Query was chosen over Redux Toolkit because:
- The dashboard is **server-state driven** — all data lives in the backend
- Provides automatic background refetch, deduplication, and cache invalidation
- Minimal boilerplate vs. Redux slice reducers for a read-heavy dashboard

---

## 🔮 Future Improvements

- [ ] Replace static token auth with JWT (access + refresh tokens)
- [ ] Add cursor-based pagination for document listing
- [ ] Cloud file storage (AWS S3 / GCS) for document uploads
- [ ] Email/Slack alerting when a mismatch is detected
- [ ] Multi-tenant support (per-company PO namespacing)
- [ ] Bulk CSV upload for SKU Master
- [ ] Webhook support for real-time ERP integration
- [ ] Audit trail with user attribution (who uploaded each document)
- [ ] Dashboard analytics: match rates over time, top mismatch reasons
- [ ] Gemini confidence score surfacing in UI

---

## 🛠️ AI Tools Used

| Tool | Purpose |
|---|---|
| **Google Gemini Flash (1.5 / 2.0)** | Multimodal document OCR — extracts structured JSON from PDF and image uploads of POs, GRNs, and Invoices |
| **Gemini API via `@google/generative-ai` SDK** | Backend integration for inline Base64 document parsing |

> The Gemini model is called with document-type-specific prompts (`po`, `grn`, `invoice`) and the response is validated via Zod schemas before being persisted to the database. If the initial extraction is malformed, the prompt is enriched with the validation error and retried once.

---

*Three-Way Match Engine — Built for procurement reconciliation automation.*
