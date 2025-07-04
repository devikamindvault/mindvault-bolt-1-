import { apiRequest } from '@/lib/queryClient';

// Wrapper function for apiRequest that properly types the function parameters
export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';
  const data = options?.body ? JSON.parse(options.body as string) : undefined;
  
  const response = await apiRequest(method, url, data);
  
  // For endpoints that might not return JSON
  if (method === 'DELETE' || url.includes('/logout')) {
    return {} as T;
  }
  
  try {
    const result = await response.json();
    return result as T;
  } catch (error) {
    console.warn('Response was not JSON:', error);
    return {} as T;
  }
}

export default fetchApi;