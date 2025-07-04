import { apiRequest } from '@/lib/queryClient';

/**
 */
  success?: boolean;
  userId?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  code?: string;
  message?: string;
}

/**
 */
  console.log("Attempting registration via server proxy with:", email);
  
  try {
      method: 'POST',
    });
    
    console.log("Full server response:", response);
    
      throw new Error(
        response?.message || 
      );
    }
    
    
    try {
      return userCredential;
    } catch (signInError) {
      throw signInError;
    }
  } catch (error) {
    console.error("Registration API request failed:", error);
    throw error;
  }
};

/**
 */
  console.log("Attempting login via server proxy with:", email);
  
  try {
      method: 'POST',
    });
    
    console.log("Full server response:", response);
    
      throw new Error(
        response?.message || 
      );
    }
    
    
    try {
      return userCredential;
    } catch (signInError) {
      throw signInError;
    }
  } catch (error) {
    console.error("Login API request failed:", error);
    throw error;
  }
};

/**
 * Sign in with Google through our server proxy
 */
export const loginWithGoogle = async (): Promise<void> => {
  console.log("Using Google sign-in through server proxy...");
  
};

/**
 * This function should be called when checking if a redirect occurred
 */
  }
  
  
  try {
    
    
    return userCredential;
  } catch (signInError) {
    throw signInError;
  }
};

/**
 */
  
  // Add domain information for proper continueUrl construction
  const domain = window.location.origin;
  
  await apiRequest({
    method: 'POST',
    body: { 
      email,
      domain // Include the domain so server can construct proper continueUrl
    }
  });
  
};

/**
 */
  const response = await apiRequest<{ email: string }>({
    method: 'POST',
    body: { oobCode }
  });
  
  return response.email;
};

/**
 */
  await apiRequest({
    method: 'POST',
  });
};

/**
 */
  try {
    
    // First, check if our server is running
    try {
      const response = await fetch('/api/status', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Add timeout and cache control for more reliable check
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (!response.ok) {
        console.error("Server status check failed with status:", response.status);
        return false;
      }
      
      const statusData = await response.json();
      console.log("Server status:", statusData);
      
        return false;
      }
      
      // Verify environment variables
      if (Object.values(statusData.environment).includes('missing')) {
                    Object.entries(statusData.environment)
                      .filter(([_, value]) => value === 'missing')
                      .join(', '));
        return false;
      }
    } catch (serverError) {
      console.error("Server status check failed:", serverError);
    }
    
    try {
      // We're not actually creating an account, just testing connectivity
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      // If we get a 400 status, that's good - it means we can reach the API
      if (testResponse.status === 400) {
        return true;
      }
    } catch (directError) {
      // Type-safe way to handle the error message
      const errorMsg = directError instanceof Error 
        ? directError.message 
        : "No details available";
      console.error("Network error details:", errorMsg);
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};