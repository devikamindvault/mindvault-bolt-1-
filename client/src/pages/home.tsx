import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Target, BarChart3 } from "lucide-react";

interface Quote {
  id: number;
  text: string;
  author: string;
}

export default function Home() {
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  
  // Fetch daily quote
  const { data: quote } = useQuery<Quote>({
    queryKey: ['daily-quote'],
    queryFn: async () => {
      const response = await fetch('/api/quotes/daily');
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setDailyQuote(data);
    }
  });

  return (
    <div className="min-h-screen bg-[#1a1a3e]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <div className="mr-6 flex items-center space-x-2">
              <Mic className="h-6 w-6" />
              <span className="font-bold">MindVault</span>
            </div>
          </div>
        </div>
      </header>

      <div className="h-full">
        <div className="relative bg-background/95 rounded-lg shadow-lg p-4 m-2">
          <div className="editor-content transition-all duration-300 relative">
            {/* Quote of the Day */}
            <div className="flex flex-col gap-3 mb-4 p-4 bg-card rounded-lg border border-border">
              <div className="quote-of-the-day p-3 bg-muted/30 rounded-lg shadow-sm border border-border">
                <h3 className="text-lg font-medium text-primary mb-2">Quote of the Day</h3>
                <p className="text-md italic text-foreground/90 mb-2">
                  {quote?.text || "The only way to do great work is to love what you do."}
                </p>
                <p className="text-sm text-muted-foreground">
                  — {quote?.author || "Steve Jobs"}
                </p>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-purple-950/80 border-purple-800 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-blue-400" />
                    Voice Recording
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Record your thoughts and ideas with voice-to-text functionality.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-purple-950/80 border-purple-800 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-400" />
                    Goal Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Set and track your personal and professional goals.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-purple-950/80 border-purple-800 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View insights about your productivity and progress.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Demo Content */}
            <Card className="bg-card/5 border border-primary/20">
              <CardHeader>
                <CardTitle>Welcome to MindVault</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    This is a simplified version of MindVault - your personal voice-powered journal and goal management system.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Features</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Voice-to-text transcription</li>
                        <li>• Goal setting and tracking</li>
                        <li>• Progress analytics</li>
                        <li>• Daily inspirational quotes</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Getting Started</h4>
                      <p className="text-sm text-muted-foreground">
                        This is a static demo version. The full application would include 
                        user authentication, data persistence, and real-time voice recording capabilities.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}