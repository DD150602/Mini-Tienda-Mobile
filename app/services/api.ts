const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:4000/api';

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.msg || payload?.error || `Error HTTP ${response.status}`);
  return payload;
}

export const unwrapList = <T,>(payload: any, key: string): T[] => Array.isArray(payload) ? payload : payload?.[key] ?? payload?.data?.[key] ?? [];
export const money = (value: unknown) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value) || 0);
