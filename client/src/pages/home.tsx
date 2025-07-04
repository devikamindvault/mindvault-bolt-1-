import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";
import { format, subDays } from "date-fns";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Transcription, Goal } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Mic, Settings, User, Home as HomeIcon, Target, BarChart3, LogOut } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Quote {
  text: string;
}

export default function Home() {
  const [selectedMainGoal, setSelectedMainGoal] = useState<Goal | null>(null);
  const [selectedSubGoal, setSelectedSubGoal] = useState<Goal | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  
  // Fetch daily quote
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch('/api/quotes/daily');
        if (response.ok) {
          const data = await response.json();
          setDailyQuote(data);
        } else {
          console.error('Failed to fetch daily quote');
        }
      } catch (error) {
        console.error('Error fetching daily quote:', error);
      }
    };
    
    fetchQuote();
  }, []);

  const handleGoalSelect = (goal: Goal) => {
    setSelectedMainGoal(goal);
    setSelectedSubGoal(null);
  };

  const handleSubGoalSelect = (goal: Goal) => {
    setSelectedSubGoal(goal);
  };

  const activeGoal = selectedSubGoal || selectedMainGoal;

  const { data: transcriptions = [], error: transcriptionsError, isLoading, refetch: refetchTranscriptions } = useQuery<Transcription[]>({
    onSuccess: (data) => {
      console.log("Transcriptions loaded successfully:", data);
    },
    onError: (error) => {
      console.error("Failed to fetch transcriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load transcriptions. Please try again.",
        variant: "destructive"
      });
    },
    // Try re-fetching on start
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 1000, // Consider data stale after 1 second
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000) // Exponential backoff
  });
  
  // Refetch on component mount to ensure latest data
  useEffect(() => {
    console.log("Manually refetching transcriptions");
    refetchTranscriptions();
  }, [refetchTranscriptions]);

  // Debug log for rendering
  console.log("Current transcriptions:", transcriptions);
  console.log("Transcriptions error:", transcriptionsError);
  console.log("Is loading:", isLoading);

  const { data: goals = [], error: goalsError } = useQuery<Goal[]>({
    onError: (error) => {
      console.error("Failed to fetch goals:", error);
      toast({
        title: "Error",
        description: "Failed to load goals",
        variant: "destructive"
      });
    },
    retry: 3
  });

  // Process data for charts (unchanged)
  const projectStats = useMemo(() => {
    const stats = goals.map(goal => {
      const goalTranscriptions = transcriptions.filter(t => t.goalId === goal.id);
      return {
        goalId: goal.id,
        title: goal.title,
        count: goalTranscriptions.length,
        duration: Math.round(goalTranscriptions.reduce((acc, t) => acc + (t.duration || 0), 0) / 60) 
      };
    });
    return stats.sort((a, b) => b.count - a.count);
  }, [goals, transcriptions]);

  // Generate daily activity data (unchanged)
  const dailyActivity = useMemo(() => {
    const days = 14; 
    const activity = Array.from({ length: days }).map((_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dateStr = format(date, 'MMM dd');
      const count = transcriptions.filter(t => {
        const tDate = new Date(t.createdAt);
        return format(tDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      }).length;
      return { date: dateStr, count };
    });
    return activity;
  }, [transcriptions]);

  const { toast } = useToast();
  const [currentText, setCurrentText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#ffeb3b");

  // Group transcriptions by date (moved to edited section)
    const date = format(new Date(transcription.createdAt || ''), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transcription);
    return acc;
  }, {});

  const saveMutation = useMutation({
    mutationFn: async ({ content, goalId }: { content: string; goalId?: number }) => {
      console.log('Saving transcription...', { content, goalId });
      // Create sanitized plain text version for backend storage
      // This removes HTML tags for cleaner storage while preserving content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const plainText = tempDiv.textContent || tempDiv.innerText || content;
      
      try {
        const result = await apiRequest("POST", "/api/transcriptions", { 
          content: plainText,
          goalId 
        });
        console.log('Transcription saved successfully', result);
        return result;
      } catch (error) {
        console.error('Error in saveMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Invalidating transcriptions query cache');
      toast({
        title: "Success",
        description: "Transcription saved successfully",
      });
      setCurrentText("");
    },
    onError: (error) => {
      console.error('Save mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to save transcription. Please try again.",
        variant: "destructive"
      });
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
              <Link href="/analysis" className="transition-colors hover:text-foreground/80 text-muted-foreground flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Analysis
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    {user?.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt={user.username || 'User'} 
                        className="h-8 w-8 rounded-full" 
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/goals">
                      <Target className="mr-2 h-4 w-4" /> Goals
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/analysis">
                      <BarChart3 className="mr-2 h-4 w-4" /> Analysis
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                    <p className="text-md italic text-foreground/90 mb-2">{dailyQuote?.text || "The only way to do great work is to love what you do."}</p>
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
                <VoiceRecorder onTranscription={(text, goalId) => {
                  saveMutation.mutate({ content: text, goalId });
                }} />
              </TabsContent>

              <TabsContent value="history">
                <div className="container mx-auto py-6 px-4 space-y-4">
                  {/* Goal Filtering Section */}
                  <div className="flex gap-2 pb-4 flex-wrap">
                    <Button
                      variant={!activeGoal ? "default" : "outline"}
                      onClick={() => {
                        setSelectedMainGoal(null);
                        setSelectedSubGoal(null);
                      }}
                    >
                      All Activities
                    </Button>
                    {goals.map((goal) => (
                      <Button
                        variant={selectedMainGoal?.id === goal.id ? "default" : "outline"}
                        onClick={() => handleGoalSelect(goal)}
                      >
                        {goal.title}
                      </Button>
                    ))}
                  </div>

                  {/* Actual User Data Display */}
                  {Object.entries(transcriptionsByDate)
                    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                    .map(([date, dayTranscriptions]) => {
                      const filteredTranscriptions = activeGoal
                        ? dayTranscriptions.filter(t => t.goalId === activeGoal.id)
                        : dayTranscriptions;

                      if (filteredTranscriptions.length === 0) return null;

                      return (
                          <CardHeader className="bg-muted/10 py-3 px-4">
                            <CardTitle className="text-lg">
                              {format(new Date(date), 'MMMM d, yyyy')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            {filteredTranscriptions.map((t, i) => (
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1">
                                    <div className="prose dark:prose-invert" 
                                         dangerouslySetInnerHTML={{ __html: t.content || '' }} />
                                    <div className="mt-2 flex gap-2 flex-wrap">
                                      {t.goalId && (
                                        <Badge variant="secondary">
                                          {goals.find(g => g.id === t.goalId)?.title || 'Uncategorized'}
                                        </Badge>
                                      )}
                                      {t.duration && (
                                        <Badge variant="outline">
                                          Duration: {Math.round(t.duration / 60)} minutes
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {format(new Date(t.createdAt || Date.now()), 'HH:mm')}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    })}

                  {/* Empty State Handling */}
                    <div className="text-center py-12">
                      <div className="text-muted-foreground mb-4">
                        No activities found yet. Record your first voice note!
                      </div>
                      <Button onClick={() => setIsOpen(true)}>
                        Start Recording
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}