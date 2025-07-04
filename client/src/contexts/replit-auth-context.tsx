import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Define the user type
export interface User {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
}

// Define the context shape
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
}

// Create the context with a default value
  user: null,
  isLoading: true,
  error: null,
  login: () => {},
  logout: () => {},
});

// Create a provider component
  children: ReactNode;
}

  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch user data from the API
  const { data: user, isLoading, error: fetchError, refetch } = useQuery<User | null>({
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      console.log("Fetching data from /api/user");
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error JSON:", errorData);
          throw new Error(`${response.status}: ${JSON.stringify(errorData)}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching from /api/user:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Fetched data from /api/user:", data);
    },
    onError: (err) => {
      console.error("Error fetching from /api/user:", err);
    }
  });

  // Handle fetch errors
  useEffect(() => {
    if (fetchError) {
      
      if ((fetchError as any).status === 401) {
        setError(null);
      } else {
      }
    } else {
      setError(null);
    }
  }, [fetchError]);

  // Login function
  const login = () => {
    // Redirect to login endpoint
    console.log("Logging in...");
    window.location.href = '/api/login';
  };

  // Logout function
  const logout = () => {
    // Redirect to logout endpoint
    console.log("Logging out...");
    window.location.href = '/api/logout';
  };

  // Prepare the context value
    user: user || null,
    isLoading,
    error,
    login,
    logout,
  };

  return (
      {children}
  );
};

  if (context === undefined) {
  }
  return context;
};

