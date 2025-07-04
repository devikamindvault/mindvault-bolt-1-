
import { 
  signOut,

// Import the proxy functions that communicate with our server
import {
  loginWithGoogle as proxyLoginWithGoogle,

};

});


// Set up Google provider
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export the functions from our proxy with identical signatures

// Use our proxy implementation for Google sign-in
export const loginWithGoogle = proxyLoginWithGoogle;

  try {
  } catch (error) {
    throw error;
  }
};

export const getGoogleRedirectResult = async () => {
  try {
    const url = new URL(window.location.href);
    
      
      
      window.history.replaceState({}, document.title, url.pathname);
      
      return result;
    }
    
    // Check for error in redirect URL
    if (error) {
    }
    
    return null;
  } catch (error) {
    console.error("Error processing redirect result:", error);
    throw error;
  }
};

export const logoutUser = async () => {
};

// Use the proxy versions of these functions

  return new Promise((resolve) => {
      unsubscribe();
      resolve(user);
    });
  });
};


// Use the proxy version of connectivity check
