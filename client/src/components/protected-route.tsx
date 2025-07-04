import React, { ComponentType, ReactNode, useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  component: ComponentType<any>;
  path: string;
}

export function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const [match, params] = useRoute(rest.path);

  useEffect(() => {
    if (!loading) {
      if (!user && match) {
      }
    }
  }, [user, loading, match, navigate]);

    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <Component {...params} user={user} />;
}

export default ProtectedRoute;