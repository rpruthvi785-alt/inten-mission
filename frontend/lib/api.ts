const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof process !== 'undefined' && (process.env as any).VITE_API_URL) ||
  'http://localhost:5000';

function getAuthToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || 'demo-static-token';
  }
  return 'demo-static-token';
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!headers['Authorization'] && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `API request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

// Authentication
export async function login(username: string, password: string) {
  const data = await apiRequest<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (typeof window !== 'undefined' && data.token) {
    localStorage.setItem('auth_token', data.token);
  }
  return data;
}

// Match Result
export async function fetchMatchResult(poNumber: string) {
  return apiRequest<any>(`/match/${encodeURIComponent(poNumber)}`);
}

// Summary Statistics
export async function fetchSummary(poNumber: string) {
  return apiRequest<any>(`/summary/${encodeURIComponent(poNumber)}`);
}

// Documents
export async function fetchDocuments(type?: string, poNumber?: string) {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (poNumber) params.append('poNumber', poNumber);
  return apiRequest<any>(`/documents?${params.toString()}`);
}

export async function fetchDocumentById(id: string) {
  return apiRequest<any>(`/documents/${id}`);
}

export function getDocumentFileUrl(id: string): string {
  return `${API_BASE_URL}/documents/${id}/file`;
}

// Upload Document
export async function uploadDocumentFile(file: File, documentType: string, parsedData?: any) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  if (parsedData) {
    formData.append('parsedData', typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData));
  }

  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    let msg = `Upload failed (${res.status})`;
    try {
      const err = await res.json();
      if (err.error) msg = err.error;
    } catch (_) {}
    throw new Error(msg);
  }

  return res.json();
}

// SKU Master
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
  return apiRequest<any>(`/masters/sku/${id}`, {
    method: 'DELETE',
  });
}
