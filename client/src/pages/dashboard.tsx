import { Button } from "@/components/ui/button";

export default function DashboardPage() {

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-card rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="flex flex-col items-start mb-6 bg-background p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">User Profile</h2>
          {currentUser ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">User ID: {currentUser.uid}</p>
              <p className="text-sm text-muted-foreground">Email: {currentUser.email}</p>
              <p className="text-sm text-muted-foreground">Email Verified: {currentUser.emailVerified ? 'Yes' : 'No'}</p>
            </div>
          ) : (
            <p>Not logged in</p>
          )}
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Home
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}