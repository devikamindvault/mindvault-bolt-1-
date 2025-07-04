import React from 'react';
import { Button } from "@/components/ui/button";

export function LoginButton() {

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  // Define purple theme styles
  const purpleThemeStyles = {
    backgroundColor: '#8a2be2', // Vibrant purple color
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 4px rgba(138, 43, 226, 0.3)',
    hover: { backgroundColor: '#7722c9' } // Darker purple for hover
  };

  return (
    <div>
        <div className="flex items-center gap-2">
          {user?.username && (
            <span className="text-sm">Hello, {user.username}</span>
          )}
          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      ) : (
        <Button 
          onClick={handleLogin}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
          style={purpleThemeStyles}
        >
          Log in with Replit
        </Button>
      )}
    </div>
  );
}