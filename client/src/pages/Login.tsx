import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";

export function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Get error message from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) {
      setErrorMessage(urlError);
    }
  }, []);

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-[350px] shadow-lg bg-white rounded-lg overflow-hidden">
          <div className="bg-purple-600 p-6 text-white">
            <h2 className="text-xl font-bold">Already Logged In</h2>
            <p className="opacity-90 text-sm">
              You're already signed in!
            </p>
          </div>
          <div className="p-6">
            <p>Hello, {user?.username || 'User'}! You are already logged in.</p>
          </div>
          <div className="px-6 pb-6">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full">
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-purple-50">
      <div className="w-[350px] shadow-lg bg-white rounded-lg overflow-hidden">
        <div className="bg-purple-600 p-6 text-white">
          <h2 className="text-xl font-bold">Welcome Back</h2>
          <p className="opacity-90 text-sm">
            Sign in with Replit
          </p>
        </div>
        <div className="p-6">
          {/* Error display section */}
          {(error || errorMessage) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600 text-sm">
              </p>
            </div>
          )}
          
          <Button 
            onClick={handleLogin} 
            className="w-full bg-purple-600 hover:bg-purple-700">
            Log in with Replit
          </Button>
          <p className="text-xs text-center mt-4 text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;