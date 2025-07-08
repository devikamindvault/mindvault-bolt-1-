import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Target, Sparkles, Home as HomeIcon, User, Mic, Edit, Trash2, Settings, FileText, Calendar, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface Goal {
  id: number;
  title: string;
  description?: string;
  content?: string;
  createdAt: string;
}

export default function Goals() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch goals
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/goals");
      return response.json();
    }
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: { title: string; description: string }) => {
      return apiRequest("POST", "/api/goals", goalData);
    },
    onSuccess: () => {
      toast({ 
        title: "Goal created successfully!",
        description: "Your new goal has been added to your goals list.",
      });
      setIsOpen(false);
      setFormData({ title: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, ...goalData }: { id: number; title: string; description: string }) => {
      return apiRequest("PATCH", `/api/goals/${id}`, goalData);
    },
    onSuccess: () => {
      toast({ 
        title: "Goal updated successfully!",
        description: "Your goal has been updated.",
      });
      setEditingGoal(null);
      setFormData({ title: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/goals/${id}`);
    },
    onSuccess: () => {
      toast({ 
        title: "Goal deleted successfully!",
        description: "Your goal has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your goal.",
        variant: "destructive",
      });
      return;
    }

    if (editingGoal) {
      updateGoalMutation.mutate({
        id: editingGoal.id,
        title: formData.title,
        description: formData.description,
      });
    } else {
      createGoalMutation.mutate(formData);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
    });
    setIsOpen(true);
  };

  const handleDelete = (goal: Goal) => {
    if (confirm(`Are you sure you want to delete "${goal.title}"?`)) {
      deleteGoalMutation.mutate(goal.id);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "" });
    setEditingGoal(null);
    setIsOpen(false);
  };

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
              <span className="text-2xl font-bold text-white drop-shadow-lg app-title">
                MindVault
              </span>
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/">
                <Button variant="ghost" className="text-slate-300 hover:text-indigo-400 hover:bg-slate-800/50">
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/goals">
                <Button variant="ghost" className="bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50 hover:text-indigo-200">
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

      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">
                Goals Management
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl leading-relaxed">
                Create and organize your goals. Select them in the home page to start writing and tracking your progress with voice-powered journaling.
              </p>
            </div>
            <Button 
              onClick={() => setIsOpen(true)} 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 glow-primary"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Goal
            </Button>
          </div>
        </div>

        {/* Goals Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="h-6 bg-slate-700 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                    <div className="h-10 bg-slate-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <Card className="text-center py-16 dark-card neon-border">
            <CardContent>
              <div className="p-6 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-2xl inline-block mb-6 glow-primary">
                <Target className="h-16 w-16 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">No goals yet</h3>
              <p className="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                Create your first goal to start organizing your thoughts and tracking progress with our voice-powered journaling system.
              </p>
              <Button 
                onClick={() => setIsOpen(true)} 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg glow-primary"
                size="lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <Card key={goal.id} className="group dark-card transition-all duration-300 hover:scale-105 overflow-hidden neon-border">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold line-clamp-2 flex-1 mr-3 text-white group-hover:text-indigo-400 transition-colors">
                      {goal.title}
                    </CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(goal)}
                        className="h-8 w-8 rounded-full hover:bg-indigo-900/50 hover:text-indigo-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal)}
                        className="h-8 w-8 rounded-full hover:bg-red-900/50 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {goal.description && (
                    <p className="text-gray-300 text-sm mb-6 line-clamp-3 flex-1">
                      {goal.description}
                    </p>
                  )}
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(goal.createdAt).toLocaleDateString()}</span>
                      </div>
                      {goal.content && (
                        <div className="flex items-center gap-1 text-green-400">
                          <FileText className="h-3 w-3" />
                          <span>Has content</span>
                        </div>
                      )}
                    </div>
                    
                    <Link href="/" className="block">
                      <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md glow-primary">
                        <Mic className="h-4 w-4 mr-2" />
                        Start Writing
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Goal Dialog */}
      <Dialog open={isOpen} onOpenChange={resetForm}>
        <DialogContent className="sm:max-w-lg bg-slate-900/95 border-slate-700 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl text-white">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg glow-primary">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              {editingGoal ? "Edit Goal" : "Create New Goal"}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {editingGoal 
                ? "Update your goal details below."
                : "Define a new goal to track your progress and stay motivated with voice-powered journaling."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2 text-white">
                <Target className="h-4 w-4 text-indigo-400" />
                Goal Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter your goal title"
                className="border-slate-600 focus:border-indigo-500 bg-slate-800/50 text-white placeholder:text-slate-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2 text-white">
                <FileText className="h-4 w-4 text-indigo-400" />
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you want to achieve with this goal..."
                className="border-slate-600 focus:border-indigo-500 bg-slate-800/50 text-white placeholder:text-slate-400 min-h-[120px]"
                rows={5}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600 text-white hover:bg-slate-700">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg glow-primary"
                disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
              >
                {createGoalMutation.isPending || updateGoalMutation.isPending 
                  ? (editingGoal ? "Updating..." : "Creating...") 
                  : (editingGoal ? "Update Goal" : "Create Goal")
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}