import { useMutation } from '@tanstack/react-query';

/**
 * It provides the same interface that the original app expects
 */
  
  // Create a mutation for logout to maintain the same interface
  const logoutMutation = useMutation({
    mutationFn: async () => {
      logout();
      return true;
    }
  });

  // Create a mutation for login to maintain the same interface
  const loginMutation = useMutation({
    mutationFn: async () => {
      login();
      return true;
    }
  });

  return {
    user,
    isLoading,
    error,
    logoutMutation,
    loginMutation,
    // Provide any additional properties that might be expected by the app
  };
}