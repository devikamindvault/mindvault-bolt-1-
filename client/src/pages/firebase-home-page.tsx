import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = () => {
    try {
      setIsLoggingOut(true);
      logout();
      // No need to await as this redirects the browser
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Whisper Voice Journal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              Welcome, <span className="font-semibold">{user?.username || user?.email}</span>
            </span>
            <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Logout"
              )}
            </Button>
          </div>
        </header>
        
        <main>
          <div className="bg-muted p-8 rounded-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Your Dashboard</h2>
            <p className="mb-4">
              You're currently logged in as <strong>{user?.username || user?.email}</strong>.
            </p>
            <div className="space-y-2">
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>Email:</strong> {user?.email || 'Not provided'}</p>
              {(user?.firstName || user?.lastName) && (
                <p><strong>Name:</strong> {[user.firstName, user.lastName].filter(Boolean).join(' ')}</p>
              )}
              {user?.profileImageUrl && (
                <div className="mt-4">
                  <p className="mb-2"><strong>Profile Photo:</strong></p>
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="h-16 w-16 rounded-full"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Your Goals</h3>
              <p className="text-muted-foreground mb-4">
                Track your progress and manage your personal goals here.
              </p>
              <Button>Manage Goals</Button>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Voice Transcriptions</h3>
              <p className="text-muted-foreground mb-4">
                Access your saved voice notes and transcriptions.
              </p>
              <Button>View Transcriptions</Button>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Analytics</h3>
              <p className="text-muted-foreground mb-4">
                View insights about your productivity and goal progress.
              </p>
              <Button>View Analytics</Button>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Account Settings</h3>
              <p className="text-muted-foreground mb-4">
                Manage your account preferences and subscription.
              </p>
              <Button>Account Settings</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}