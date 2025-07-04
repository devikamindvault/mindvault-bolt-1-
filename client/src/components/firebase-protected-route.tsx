import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {

  useEffect(() => {
      loading, 
      userId: currentUser?.uid 
    });
  }, [path, loading, currentUser]);

  if (loading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!currentUser) {
    return (
      <Route path={path}>
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}