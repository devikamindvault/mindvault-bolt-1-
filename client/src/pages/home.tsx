import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Target, BarChart3, Home as HomeIcon, User, Settings, Save, Plus } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Quote {
  id: number;
  text: string;
  author: string;
}

interface Goal {
  id: number;
  title: string;
  description?: string;
  content?: string;
}

export default function Home() {
  const [currentText, setCurrentText] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch daily quote
  const { data: quote } = useQuery<Quote>({
    queryKey: ['daily-quote'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/quotes/daily");
      return response.json();
    }
  });

  // Fetch goals for dropdown
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/goals");
      return response.json();
    }
  });

  // Save content mutation
  const saveContentMutation = useMutation({
    mutationFn: async ({ goalId, content }: { goalId: string; content: string }) => {
      return apiRequest("PATCH", `/api/goals/${goalId}`, { content });
    },
    onSuccess: () => {
      toast({
        title: "Content saved!",
        description: "Your content has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Load goal content when goal is selected
  useEffect(() => {
    if (selectedGoalId) {
      const selectedGoal = goals.find(goal => goal.id.toString() === selectedGoalId);
      if (selectedGoal) {
        setCurrentText(selectedGoal.content || "");
      }
    } else {
      setCurrentText("");
    }
  }, [selectedGoalId, goals]);

  const handleSave = () => {
    if (!selectedGoalId) {
      toast({
        title: "No goal selected",
        description: "Please select a goal before saving content.",
        variant: "destructive",
      });
      return;
    }

    saveContentMutation.mutate({
      goalId: selectedGoalId,
      content: currentText,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex flex-col">
      {/* Main Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-6">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Mic className="h-6 w-6 text-primary" />
              <span className="hidden font-bold sm:inline-block text-xl">
                MindVault
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10">
                <HomeIcon className="h-4 w-4" />
                Home
              </Link>
              <Link href="/goals" className="transition-colors hover:text-foreground/80 text-muted-foreground flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent">
                <Target className="h-4 w-4" />
                Goals
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <nav className="flex items-center md:hidden">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                  <Mic className="h-6 w-6 text-primary" />
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Quote of the Day Section */}
        <div className="bg-card border-b px-6 py-4">
          <div className="container mx-auto">
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quote of the Day
                </h3>
                <blockquote className="text-lg italic text-foreground/90 mb-3">
                  "{quote?.text || "The only way to do great work is to love what you do."}"
                </blockquote>
                <cite className="text-sm text-muted-foreground">
                  — {quote?.author || "Steve Jobs"}
                </cite>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Editor Section */}
        <div className="flex-1 flex flex-col px-6 py-6">
          <div className="container mx-auto flex-1 flex flex-col">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Select Goal:</label>
                <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose a goal to work on" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id.toString()}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Link href="/goals">
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Goal
                </Button>
              </Link>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="default"
                  onClick={handleSave}
                  disabled={!selectedGoalId || saveContentMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveContentMutation.isPending ? "Saving..." : "Save Content"}
                </Button>
              </div>
            </div>

            {/* Text Editor */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  {selectedGoalId 
                    ? `Working on: ${goals.find(g => g.id.toString() === selectedGoalId)?.title || 'Selected Goal'}`
                    : "Select a goal to start writing"
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 relative">
                  <textarea
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    placeholder={selectedGoalId 
                      ? "Start writing your thoughts, ideas, and progress for this goal..."
                      : "Please select a goal from the dropdown above to begin writing..."
                    }
                    className="w-full h-full min-h-[500px] p-6 border-0 resize-none focus:outline-none focus:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                    disabled={!selectedGoalId}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status Bar */}
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Characters: {currentText.length}</span>
                <span>Words: {currentText.trim() ? currentText.trim().split(/\s+/).length : 0}</span>
              </div>
              {selectedGoalId && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Goal selected: {goals.find(g => g.id.toString() === selectedGoalId)?.title}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}