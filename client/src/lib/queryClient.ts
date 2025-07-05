import { QueryClient } from "@tanstack/react-query";

export async function apiRequest(
  method: string,
  url: string,
  body?: any
): Promise<Response> {
  try {
    // Mock goals data for demonstration
    const mockGoals = [
      { 
        id: 1, 
        title: "Learn React Development", 
        description: "Master React hooks, components, and state management",
        content: "Today I learned about useState and useEffect hooks...",
        createdAt: new Date().toISOString()
      },
      { 
        id: 2, 
        title: "Daily Exercise Routine", 
        description: "Maintain a consistent workout schedule",
        content: "",
        createdAt: new Date().toISOString()
      },
      { 
        id: 3, 
        title: "Read 12 Books This Year", 
        description: "Expand knowledge through regular reading",
        content: "Currently reading 'The Pragmatic Programmer'...",
        createdAt: new Date().toISOString()
      }
    ];

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
    
    // Handle goals endpoints
    if (url === '/api/goals' && method === 'GET') {
      return new Response(
        JSON.stringify(mockGoals),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (url === '/api/goals' && method === 'POST') {
      // Simulate creating a new goal
      const newGoal = {
        id: Date.now(),
        ...body,
        content: "",
        createdAt: new Date().toISOString()
      };
      
      return new Response(
        JSON.stringify(newGoal),
        { 
          status: 201, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (url.includes('/api/goals/') && method === 'PATCH') {
      // Simulate updating a goal
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (url.includes('/api/goals/') && method === 'DELETE') {
      // Simulate deleting a goal
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For other endpoints, return empty arrays
    if (url.includes('/api/transcriptions')) {
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