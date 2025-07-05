import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Mic, Target, BarChart3, Home as HomeIcon, User, Settings, Save, Plus, Quote, FileText, Clock } from "lucide-react";
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
  const [isRecording, setIsRecording] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
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

  // Update word and character count
  useEffect(() => {
    setCharCount(currentText.length);
    setWordCount(currentText.trim() ? currentText.trim().split(/\s+/).length : 0);
  }, [currentText]);

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

  const handleTranscription = (transcribedText: string) => {
    if (selectedGoalId) {
      const newText = currentText ? `${currentText}\n\n${transcribedText}` : transcribedText;
      setCurrentText(newText);
    } else {
      toast({
        title: "No goal selected",
        description: "Please select a goal before recording.",
        variant: "destructive",
      });
    }
  };

  const selectedGoal = goals.find(g => g.id.toString() === selectedGoalId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                MindVault
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/">
                <Button variant="ghost" className="bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/goals">
                <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                  <Target className="h-4 w-4 mr-2" />
                  Goals
                </Button>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Quote of the Day */}
        <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Quote className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-3">Quote of the Day</h3>
                <blockquote className="text-lg italic mb-4 leading-relaxed">
                  "{quote?.text || "The only way to do great work is to love what you do."}"
                </blockquote>
                <cite className="text-white/80 font-medium">
                  — {quote?.author || "Steve Jobs"}
                </cite>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Goal Selection */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2 text-indigo-600" />
                  Select Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a goal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id.toString()}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Link href="/goals" className="block">
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Goal
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Selected Goal Info */}
            {selectedGoal && (
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Current Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {selectedGoal.title}
                  </h4>
                  {selectedGoal.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {selectedGoal.description}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3 mr-1" />
                    Last updated: {new Date().toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Writing Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Words:</span>
                  <span className="font-semibold">{wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Characters:</span>
                  <span className="font-semibold">{charCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Status:</span>
                  <span className={`text-sm font-medium ${selectedGoalId ? 'text-green-600' : 'text-amber-600'}`}>
                    {selectedGoalId ? 'Ready to write' : 'Select a goal'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl h-full">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <Mic className="h-6 w-6 mr-3 text-indigo-600" />
                    {selectedGoalId 
                      ? `Writing for: ${selectedGoal?.title}`
                      : "Voice-Powered Writing Studio"
                    }
                  </CardTitle>
                  
                  <div className="flex items-center space-x-3">
                    <VoiceRecorder 
                      onTranscription={handleTranscription}
                      isRecording={isRecording}
                      setIsRecording={setIsRecording}
                    />
                    
                    <Button
                      onClick={handleSave}
                      disabled={!selectedGoalId || saveContentMutation.isPending}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveContentMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 h-full">
                <div className="relative h-full min-h-[600px]">
                  <textarea
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    placeholder={selectedGoalId 
                      ? "Start writing your thoughts, ideas, and progress for this goal... You can also use the voice recorder to transcribe your speech!"
                      : "Please select a goal from the sidebar to begin writing. You can create new goals by clicking 'Create New Goal' or visiting the Goals page."
                    }
                    className="w-full h-full min-h-[600px] p-8 border-0 resize-none focus:outline-none focus:ring-0 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-lg leading-relaxed"
                    disabled={!selectedGoalId}
                    style={{ fontFamily: 'ui-serif, Georgia, Cambria, serif' }}
                  />
                  
                  {/* Floating status indicator */}
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                      <span className="text-sm font-medium">Recording...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}