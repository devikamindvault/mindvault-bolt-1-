import fetch from 'node-fetch';
import type { Request, Response } from 'express';

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
      })
    });
  } catch (error) {
  }
}



  email?: string;
  expiresIn?: string;
  localId?: string;
  registered?: boolean;
  displayName?: string;
  photoURL?: string;
  error?: {
    message?: string;
    code?: string;
  };
  message?: string;
}

  try {
    }

    
    
    
    
    return res.status(200).json({
      success: true,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
    });
  }
};

export async function proxySignUp(req: Request, res: Response) {
  try {
    
      return res.status(400).json({ 
        success: false,
        code: 'missing-credentials',
      });
    }
    
    console.log(`Attempting to sign up user: ${email}`);
    
    const response = await fetch(
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
        }),
      }
    );
    
    
    if (!response.ok) {
        data.error?.message || data.message || 'Unknown error');
      return res.status(response.status).json({
        success: false,
        code: data.error?.code || 'signup-failed',
        message: data.error?.message || 'Registration failed'
      });
    }
    
    
  } catch (error: any) {
    console.error('Proxy sign up error:', error);
    return res.status(500).json({ 
      success: false,
      code: 'server-error',
      message: 'Internal server error during sign up' 
    });
  }
}

export async function proxySignIn(req: Request, res: Response) {
  try {
    
      return res.status(400).json({ 
        success: false,
        code: 'missing-credentials',
      });
    }
    
    console.log(`Attempting to sign in user: ${email}`);
    
    const response = await fetch(
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
        }),
      }
    );
    
    
    if (!response.ok) {
        data.error?.message || data.message || 'Unknown error');
      return res.status(response.status).json({
        success: false,
        code: data.error?.code || 'signin-failed',
      });
    }
    
    
  } catch (error: any) {
    console.error('Proxy sign in error:', error);
    return res.status(500).json({ 
      success: false,
      code: 'server-error',
      message: 'Internal server error during sign in' 
    });
  }
}

// Proxy handler for Google Sign-In
export async function proxyGoogleSignIn(req: Request, res: Response) {
  try {
    
      return res.status(400).json({ 
        success: false,
      });
    }
    
    
    const response = await fetch(
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestUri: `${req.protocol}://${req.get('host')}`,
          returnIdpCredential: true,
        }),
      }
    );
    
    
    if (!response.ok) {
        data.error?.message || data.message || 'Unknown error');
      return res.status(response.status).json({
        success: false,
        code: data.error?.code || 'google-signin-failed',
      });
    }
    
    
  } catch (error: any) {
    console.error('Proxy Google sign in error:', error);
    return res.status(500).json({ 
      success: false,
      code: 'server-error',
      message: 'Internal server error during Google sign in' 
    });
  }
}

  try {
    const host = req.get('host');
    
    console.log("- Client ID:", clientId);
    console.log("- Redirect URI:", redirectUri);
    
      `client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=email%20profile` +
      `&access_type=offline` +
      `&prompt=select_account`;
    
    
    // Redirect user to the Google sign-in page
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to initiate Google sign-in' 
    });
  }
}

export async function proxyGoogleCallback(req: Request, res: Response) {
  try {
    const { code, error } = req.query;
    
    // If Google returned an error
    if (error) {
    }
    
    // Log the received code
    
    if (!code) {
    }
    
    const clientId = "470806766310-12u07c9m3itaanrgfsel5jofnss1rp3q.apps.googleusercontent.com";
    const host = req.get('host');
    
    console.log("- Redirect URI:", redirectUri);
    
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        redirect_uri: redirectUri,
      }).toString()
    });
    
      error?: string;
      error_description?: string; 
    };
    
    }
    
    
    try {
        
        
        
      } else {
      }
    } catch (error) {
    }
    
    }
    
  } catch (error) {
    console.error('Google callback error:', error);
  }
}

  try {
    const { email, domain } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        code: 'missing-email',
        message: 'Email is required' 
      });
    }
    
    // Use the domain from the request if available, or fall back to constructing from host
    let continueUrl;
    if (domain) {
      // Use the provided domain (allows for proper protocol)
    } else {
      // Fall back to the old behavior
      const host = req.get('host');
    }
    
    if (projectId) {
      continueUrl = `${continueUrl}?projectId=${projectId}`;
    }
    
    // Log the host and continue URL for debugging
    console.log("Email reset request for:", email);
    console.log("Domain:", domain || "not provided");
    
    const response = await fetch(
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          continueUrl
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        code: 'reset-email-failed',
      });
    }
    
    return res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false,
      code: 'server-error',
    });
  }
}

// Proxy handler for Verify Reset Code
export async function proxyVerifyResetCode(req: Request, res: Response) {
  try {
    const { oobCode } = req.body;
    
    if (!oobCode) {
      return res.status(400).json({ 
        success: false,
        code: 'missing-code',
        message: 'OOB Code is required' 
      });
    }
    
    const response = await fetch(
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oobCode,
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        code: 'verify-code-failed',
        message: data.error?.message || 'Failed to verify reset code'
      });
    }
    
    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error: any) {
    console.error('Proxy verify reset code error:', error);
    return res.status(500).json({ 
      success: false,
      code: 'server-error',
      message: 'Internal server error during reset code verification' 
    });
  }
}

  try {
    
      return res.status(400).json({ 
        success: false,
        code: 'missing-parameters',
      });
    }
    
    const response = await fetch(
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oobCode,
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        code: 'reset-failed',
      });
    }
    
    return res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false,
      code: 'server-error',
    });
  }
}