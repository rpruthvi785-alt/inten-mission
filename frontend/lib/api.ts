/**
 * Centralized API Client — Three-Way Match Engine
 *
 * URL resolution priority:
 *   1. NEXT_PUBLIC_API_URL build-time env var (set in GitHub Actions secret)
 *   2. localStorage runtime override (set from Settings page — survives hard refreshes)
 *   3. http://localhost:5000 (local development only)
 *
 * Error handling:
 *   - Network/connection errors → "Backend server is unavailable."
 *   - 401 → "Invalid username or password."
 *   - 403 → "Access denied."
 *   - No backend configured → "BACKEND_NOT_CONFIGURED" sentinel error
 */

/** Sentinel error code — detected by login page to show setup UI */
export const BACKEND_NOT_CONFIGURED = 'BACKEND_NOT_CONFIGURED';

/**
 * Detect if we are running on GitHub Pages (production static deploy).
 * We cannot use `window.location` during SSR so guard carefully.
 */
export function isGitHubPages(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('.github.io');
}

/**
 * Resolve the backend base URL.
 * Returns null when no URL is configured — callers must handle this.
 */
export function getApiBaseUrl(): string | null {
  // 1. Build-time env var (set in GitHub Actions → GitHub Secret → NEXT_PUBLIC_API_URL)
  const buildTimeUrl = process.env.NEXT_PUBLIC_API_URL;
  if (buildTimeUrl && buildTimeUrl.trim() && buildTimeUrl.trim() !== 'http://localhost:5000') {
    return buildTimeUrl.trim().replace(/\/+$/, '');
  }

  // 2. Runtime override stored in localStorage (set via Settings page)
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('api_base_url_override');
    if (override && override.trim() && override.trim().length > 5) {
      return override.trim().replace(/\/+$/, '');
    }
  }

  // 3. GitHub Pages production default
  if (isGitHubPages()) {
    return 'https://inten-mission.onrender.com';
  }

  // 4. Local development fallback
  if (buildTimeUrl && buildTimeUrl.trim()) {
    return buildTimeUrl.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:5000';
}

/** Returns true when a valid backend URL is configured for this environment */
export function isBackendConfigured(): boolean {
  return getApiBaseUrl() !== null;
}

/** Retrieve the stored runtime override URL */
export function getApiOverrideUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('api_base_url_override') || '';
}

/** Persist a runtime backend URL override */
export function setApiOverrideUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const clean = url.trim().replace(/\/+$/, '');
  if (clean) {
    localStorage.setItem('api_base_url_override', clean);
  } else {
    localStorage.removeItem('api_base_url_override');
  }
}

// ── Auth token helpers ───────────────────────────────────────────────────────
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || null;
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

// ── Core request function ────────────────────────────────────────────────────
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();

  // Guard: no backend configured
  if (baseUrl === null) {
    const err = new Error(
      'Backend server is not configured. Please go to Settings and enter your backend URL.'
    );
    (err as any).code = BACKEND_NOT_CONFIGURED;
    throw err;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const token = getAuthToken() || 'demo-static-token';
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (!headers['Authorization'] && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (networkError: any) {
    console.error(`[API] Network error reaching ${url}:`, networkError.message);
    throw new Error(
      `Backend server is unavailable. Could not connect to ${baseUrl}. ` +
      'Check that the server is running and accessible.'
    );
  }

  if (!res.ok) {
    let errorMsg = '';
    try {
      const errJson = await res.json();
      errorMsg = errJson?.error || errJson?.message || '';
    } catch (_) {}

    if (!errorMsg) {
      if (res.status === 401) {
        errorMsg = 'Invalid username or password.';
      } else if (res.status === 403) {
        errorMsg = 'Access denied. You do not have permission to perform this action.';
      } else if (res.status === 404) {
        errorMsg = 'The requested resource was not found on the server.';
      } else if (res.status === 413) {
        errorMsg = 'File is too large. Maximum upload size is 25MB.';
      } else if (res.status === 429) {
        errorMsg = 'Too many requests. Please wait a moment and try again.';
      } else if (res.status >= 500) {
        errorMsg = 'Server encountered an internal error. Please try again later.';
      } else {
        errorMsg = `Request failed with status ${res.status}.`;
      }
    }

    // Clear stale auth token on 401 (except login itself)
    if (res.status === 401 && endpoint !== '/auth/login') {
      clearAuthToken();
    }

    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

// ── Authentication ────────────────────────────────────────────────────────────
export async function login(username: string, password: string) {
  const data = await apiRequest<{ token: string; user: any; message?: string }>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (data?.token) {
    setAuthToken(data.token);
  }
  return data;
}

// ── Match Result ──────────────────────────────────────────────────────────────
export async function fetchMatchResult(poNumber: string) {
  return apiRequest<any>(`/match/${encodeURIComponent(poNumber)}`);
}

// ── Summary Statistics ────────────────────────────────────────────────────────
export async function fetchSummary(poNumber: string) {
  return apiRequest<any>(`/summary/${encodeURIComponent(poNumber)}`);
}

// ── Documents ─────────────────────────────────────────────────────────────────
export async function fetchDocuments(type?: string, poNumber?: string) {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (poNumber) params.append('poNumber', poNumber);
  const qs = params.toString();
  return apiRequest<any>(`/documents${qs ? `?${qs}` : ''}`);
}

export async function fetchDocumentById(id: string) {
  return apiRequest<any>(`/documents/${id}`);
}

export function getDocumentFileUrl(id: string): string {
  const baseUrl = getApiBaseUrl() || 'http://localhost:5000';
  const token = getAuthToken() || 'demo-static-token';
  return `${baseUrl}/documents/${id}/file?token=${encodeURIComponent(token)}`;
}

// ── Upload Document ───────────────────────────────────────────────────────────
export async function uploadDocumentFile(file: File, documentType: string, parsedData?: any) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    const err = new Error('Backend server is not configured. Go to Settings and enter your backend URL.');
    (err as any).code = BACKEND_NOT_CONFIGURED;
    throw err;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  if (parsedData) {
    formData.append('parsedData', typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData));
  }

  const token = getAuthToken() || 'demo-static-token';
  const url = `${baseUrl}/documents/upload`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch (networkErr) {
    throw new Error(`Document upload failed. Could not reach ${baseUrl}. Check your connection.`);
  }

  if (!res.ok) {
    let msg = `Upload failed (${res.status}).`;
    try {
      const err = await res.json();
      if (err?.error) msg = err.error;
    } catch (_) {}
    throw new Error(msg);
  }

  return res.json();
}

// ── SKU Master ────────────────────────────────────────────────────────────────
export async function fetchSkus(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<any[]>(`/masters/sku${query}`);
}

export async function createSku(skuData: any) {
  return apiRequest<any>('/masters/sku', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(skuData),
  });
}

export async function updateSku(id: string, updates: any) {
  return apiRequest<any>(`/masters/sku/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteSku(id: string) {
  return apiRequest<any>(`/masters/sku/${id}`, { method: 'DELETE' });
}
