import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      // Try to parse as JSON first
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorJson = await res.clone().json();
        console.error(`API Error JSON:`, errorJson);
        errorMessage = JSON.stringify(errorJson);
      } else {
        errorMessage = await res.text();
      }
    } catch (e) {
      // If JSON parsing fails, fall back to text
      errorMessage = await res.text() || res.statusText;
    }
    
    console.error(`API Error: ${res.status}: ${errorMessage} for ${res.url}`);
    
    // Create a custom error object with response details
    const error: any = new Error(`${res.status}: ${errorMessage}`);
    error.status = res.status;
    error.response = {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      data: errorMessage
    };
    throw error;
  }
}

export async function apiRequest<T = any>(
  urlOrOptions: string | { url: string; method?: string; body?: any; headers?: Record<string, string> },
  options?: RequestInit
): Promise<T> {
  let url: string;
  let method: string = 'GET';
  let body: any = undefined;
  let headers: Record<string, string> = {};
  
  // Handle different parameter formats
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    method = options?.method || 'GET';
    body = options?.body;
    headers = options?.headers || {};
  } else {
    url = urlOrOptions.url;
    method = urlOrOptions.method || 'GET';
    body = urlOrOptions.body;
    headers = urlOrOptions.headers || {};
  }
  
  console.log(`Making API ${method} request to ${url}`, body || '');
  
  try {
    // If Content-Type is not set and there's a body, default to JSON
    if (body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    const res = await fetch(url, {
      method,
      headers,
      body: body && headers['Content-Type'] === 'application/json' ? JSON.stringify(body) : body,
      credentials: "include",
    });

    if (res.status === 401) {
      // We're using server-side cookies now, so remove any localStorage data
      if (localStorage.getItem('sessionUser')) {
        console.log('Removing outdated user data from localStorage due to 401');
        localStorage.removeItem('sessionUser');
      }
    }

    await throwIfResNotOk(res);
    console.log(`API ${method} request to ${url} succeeded`);
    
    // Check if response is empty
    const contentLength = res.headers.get('Content-Length');
    if (contentLength === '0' || res.status === 204) {
      return {} as T; // Return empty object for no-content responses
    }
    
    // Try to parse as JSON, fall back to text if not JSON
    const contentType = res.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json() as T;
    } else {
      const text = await res.text();
      try {
        return JSON.parse(text) as T;
      } catch (e) {
        return text as unknown as T;
      }
    }
  } catch (error) {
    console.error(`API ${method} request to ${url} failed:`, error);
    throw error;
  }
}

export const getQueryFn: <T>(options: {
}) => QueryFunction<T> =
    
    try {
        credentials: "include",
      });

      if (res.status === 401) {
        // We're using server-side cookies now, so remove any localStorage data
        if (localStorage.getItem('sessionUser')) {
          console.log('Removing outdated user data from localStorage due to 401');
          localStorage.removeItem('sessionUser');
        }
        
        // You need to be logged in to access this data
          console.log('Returning null due to 401');
          return null;
        }
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
