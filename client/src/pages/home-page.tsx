
import { Button } from "@/components/ui/button";

export default function HomePage() {
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mindvault</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              Welcome, <span className="font-semibold">{user?.username}</span>
            </span>
            <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </header>
        
        <main>
          <div className="bg-muted p-8 rounded-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Mindvault</h2>
            <p className="mb-4">
              Your powerful voice-powered journal and goal management system. Capture your thoughts with ease and track your progress effectively.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Voice Features</h3>
              <p className="text-muted-foreground mb-4">
                Record your thoughts with high-quality voice transcription. Download transcriptions with embedded media, images, and attachments.
              </p>
              <Button>Start Recording</Button>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Media Integration</h3>
              <p className="text-muted-foreground mb-4">
                Add images, audio clips, and documents to your entries. All media is downloadable with your transcriptions.
              </p>
              <Button>View Media</Button>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Track your productivity and goal progress with detailed insights and visualizations.
              </p>
              <Button>View Analytics</Button>
            </div>
            
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Export Options</h3>
              <p className="text-muted-foreground mb-4">
                Download your entries as PDFs with clickable media elements and full transcription text.
              </p>
              <Button>Export Data</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
