// Admin API helper for Telegram WebView compatibility
export function getAdminToken(): string | null {
  return localStorage.getItem('adminToken');
}

export function setAdminToken(token: string): void {
  localStorage.setItem('adminToken', token);
}

export function removeAdminToken(): void {
  localStorage.removeItem('adminToken');
}

export async function adminApiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}