import { QueryClient } from "@tanstack/react-query";

export async function apiRequest(
  method: string,
  url: string,
  body?: any
): Promise<Response> {
  try {
    // For static app, we'll just simulate API calls
    if (url === '/api/quotes/daily') {
      // Simulate a daily quote API
      const quotes = [
        { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { id: 2, text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
        { id: 3, text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
        { id: 4, text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { id: 5, text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" }
      ];
      
      // Get a consistent quote based on the day
      const today = new Date();
      const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      const quoteIndex = dateSeed % quotes.length;
      
      // Create a mock response
      const mockResponse = new Response(
        JSON.stringify(quotes[quoteIndex]),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      return mockResponse;
    }
    
    // For other endpoints, return empty arrays
    if (url.includes('/api/goals') || url.includes('/api/transcriptions')) {
      return new Response(
        JSON.stringify([]),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Default response for other API calls
    return new Response(
      JSON.stringify({ message: "Static app - no real API calls" }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error(`API ${method} request to ${url} failed:`, error);
    throw error;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
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