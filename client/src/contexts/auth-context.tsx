import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  useQuery, 
  useMutation, 
  UseMutationResult,
  QueryClient
} from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';

interface User {
  id: number;
  email: string;
  username: string;
}

type LoginData = {
  username: string;
};

type RegisterData = {
  username: string;
  email: string;
};

  user: User | null;
  loading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
}


  const [, setLocation] = useLocation();
  
  // Get current user
  const { 
    data: user, 
    isLoading: loading, 
    error, 
    refetch: refetchUser
  } = useQuery<User | null, Error>({
    queryFn: async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        
          return data.user;
        } else {
          return null;
        }
      } catch (error) {
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false
  });

  // Login mutation
  const loginMutation = useMutation<User, Error, LoginData>({
    mutationFn: async (credentials) => {
      const response = await apiRequest('POST', '/api/login', credentials);
      const result = await response.json();
      if (result && result.user) {
        return result.user;
      }
      throw new Error('Invalid login response');
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['/api/user'], userData);
      setLocation('/');
    }
  });

  // Register mutation
  const registerMutation = useMutation<User, Error, RegisterData>({
    mutationFn: async (userData) => {
      const response = await apiRequest('POST', '/api/register', userData);
      const result = await response.json();
      if (result && result.user) {
        return result.user;
      }
      throw new Error('Invalid registration response');
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['/api/user'], userData);
      setLocation('/');
    }
  });

  // Logout mutation
  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiRequest('POST', '/api/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
    }
  });

  // Legacy methods for backward compatibility
    try {
      const result = await loginMutation.mutateAsync({ 
        username: email, 
      });
      return result;
    } catch (error) {
      throw error;
    }
  };

    try {
      const result = await registerMutation.mutateAsync({ 
        email, 
        username 
      });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout error:', error);
      // Force client-side logout regardless of server response
      queryClient.setQueryData(['/api/user'], null);
    }
  };

    try {
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  // Refresh user data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        // Only refresh if we're logged in
        refetchUser();
      }
    }, 1000 * 60 * 15); // 15 minutes
    
    return () => clearInterval(interval);
  }, [user, refetchUser]);

  return (
      user,
      loading,
      error: error || null,
      login,
      register,
      logout,
      loginMutation,
      registerMutation,
      logoutMutation,
    }}>
      {children}
  );
}

  if (!context) {
  }
  return context;
};