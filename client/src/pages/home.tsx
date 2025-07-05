import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Target, BarChart3, Home as HomeIcon, User, Settings } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface Quote {
  id: number;
  text: string;
  author: string;
}

export default function Home() {
  const [currentText, setCurrentText] = useState("");

  // Fetch daily quote
  const { data: quote } = useQuery<Quote>({
    queryKey: ['daily-quote'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/quotes/daily");
      return response.json();
    }
  });

  return (
    <div className="min-h-screen bg-[#1a1a3e]">
      {/* Main Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Mic className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">
                MindVault
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground flex items-center gap-1">
                <HomeIcon className="h-4 w-4" />
                Home
              </Link>
              <Link href="/goals" className="transition-colors hover:text-foreground/80 text-muted-foreground flex items-center gap-1">
                <Target className="h-4 w-4" />
                Goals
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <nav className="flex items-center md:hidden">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                  <Mic className="h-6 w-6" />
                  <span className="font-bold">MindVault</span>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="h-full">
        <div className="relative bg-background/95 rounded-lg shadow-lg p-4 m-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="editor-content transition-all duration-300 relative">
            <div className="flex flex-col gap-3 mb-4 p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-1">
                <div className="w-full">
                  <div className="quote-of-the-day p-3 bg-muted/30 rounded-lg shadow-sm border border-border">
                    <h3 className="text-lg font-medium text-primary mb-2">Quote of the Day</h3>
                    <p className="text-md italic text-foreground/90 mb-2">{quote?.text || "The only way to do great work is to love what you do."}</p>
                    <p className="text-sm text-muted-foreground">— {quote?.author || "Steve Jobs"}</p>
                  </div>
                </div>
              </div>
            </div>
            <Tabs defaultValue="record">
              <TabsList>
                <TabsTrigger value="record">Record</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="record" className="relative">
                <div className="space-y-3 p-3 rounded-lg shadow-sm border border-border bg-card/80 relative overflow-hidden bg-pattern w-full">
                  <div className="flex flex-wrap items-center gap-3 justify-between relative z-10">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="outline">
                        Select Goal
                      </Button>
                      <Button
                        variant="default"
                        className="flex items-center gap-2 relative overflow-hidden"
                      >
                        <Mic className="h-5 w-5" />
                        Start Recording
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    <div className="relative">
                      <div
                        className="w-full min-h-[250px] p-4 border border-border rounded-lg bg-muted/30 text-foreground transition-colors duration-300 focus:outline-none shadow-sm"
                        contentEditable
                        onInput={(e) => setCurrentText(e.currentTarget.textContent || "")}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-4">
                    <Button 
                      variant="default"
                      className="relative overflow-hidden flex items-center"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="container mx-auto py-6 px-4 space-y-4">
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-4">
                      No activities found yet. Record your first voice note!
                    </div>
                    <Button>
                      Start Recording
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}