import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { RichTextEditor } from "@/components/RichTextEditor";
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
    // Remove HTML tags for counting
    const textOnly = currentText.replace(/<[^>]*>/g, '');
    setCharCount(textOnly.length);
    setWordCount(textOnly.trim() ? textOnly.trim().split(/\s+/).length : 0);
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
    if (!selectedGoalId) {
      toast({
        title: "No goal selected",
        description: "Please select a goal before recording.",
        variant: "destructive",
      });
      return;
    }

    // Properly append transcribed text to the editor content
    const textToAdd = transcribedText.trim();
    if (textToAdd) {
      // Add the transcribed text with proper spacing
      const separator = currentText.trim() ? ' ' : '';
      const newText = currentText + separator + textToAdd;
      setCurrentText(newText);
    }
  };

  const selectedGoal = goals.find(g => g.id.toString() === selectedGoalId);

  return (
    <div className="min-h-screen dark-gradient-bg">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-700 bg-slate-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-slate-900/60 shadow-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg glow-primary">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent text-shadow">
                MindVault
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/">
                <Button variant="ghost" className="bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50 hover:text-indigo-200">
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/goals">
                <Button variant="ghost" className="text-slate-300 hover:text-indigo-400 hover:bg-slate-800/50">
                  <Target className="h-4 w-4 mr-2" />
                  Goals
                </Button>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-800/50">
              <Settings className="h-5 w-5 text-slate-300" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-800/50">
              <User className="h-5 w-5 text-slate-300" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Quote of the Day */}
        <Card className="neon-border dark-card glow-purple">
          <CardContent className="p-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full glow-purple">
                <Quote className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-3 text-slate-100">Quote of the Day</h3>
                <blockquote className="text-lg italic mb-4 leading-relaxed text-slate-200">
                  "{quote?.text || "The only way to do great work is to love what you do."}"
                </blockquote>
                <cite className="text-slate-400 font-medium">
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
            <Card className="dark-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg text-slate-100">
                  <Target className="h-5 w-5 mr-2 text-indigo-400" />
                  Select Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                  <SelectTrigger className="w-full bg-slate-800 border-slate-600 text-slate-200">
                    <SelectValue placeholder="Choose a goal..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id.toString()} className="text-slate-200 focus:bg-slate-700">
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Link href="/goals" className="block">
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Goal
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Selected Goal Info */}
            {selectedGoal && (
              <Card className="dark-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg text-slate-100">
                    <FileText className="h-5 w-5 mr-2 text-green-400" />
                    Current Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-slate-100 mb-2">
                    {selectedGoal.title}
                  </h4>
                  {selectedGoal.description && (
                    <p className="text-sm text-slate-400 mb-4">
                      {selectedGoal.description}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Last updated: {new Date().toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <Card className="dark-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg text-slate-100">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
                  Writing Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Words:</span>
                  <span className="font-semibold text-slate-200">{wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Characters:</span>
                  <span className="font-semibold text-slate-200">{charCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Status:</span>
                  <span className={`text-sm font-medium ${selectedGoalId ? 'text-green-400' : 'text-amber-400'}`}>
                    {selectedGoalId ? 'Ready to write' : 'Select a goal'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Card className="dark-card h-full">
              <CardHeader className="border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl text-slate-100">
                    <Mic className="h-6 w-6 mr-3 text-indigo-400" />
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
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg glow-primary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveContentMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 h-full">
                <div className="relative h-full">
                  {selectedGoalId ? (
                    <RichTextEditor
                      content={currentText}
                      onChange={setCurrentText}
                      goalTitle={selectedGoal?.title}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-96 text-slate-500">
                      <div className="text-center">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                        <h3 className="text-lg font-medium mb-2">No Goal Selected</h3>
                        <p className="text-sm">Please select a goal from the sidebar to begin writing.</p>
                        <Link href="/goals" className="inline-block mt-4">
                          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Goal
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  {/* Floating status indicator */}
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg animate-pulse glow-primary z-10">
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