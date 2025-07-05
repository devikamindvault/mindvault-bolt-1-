import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Target, Sparkles, Clock, Tag, Home as HomeIcon, User, Mic, Edit, Trash2 } from "lucide-react";
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
              <Link href="/" className="transition-colors hover:text-foreground/80 text-muted-foreground flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent">
                <HomeIcon className="h-4 w-4" />
                Home
              </Link>
              <Link href="/goals" className="transition-colors hover:text-foreground/80 text-foreground flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10">
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

      {/* Main Content */}
      <div className="flex-1 px-6 py-8">
        <div className="container mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
                  Goals Management
                </h1>
                <p className="text-muted-foreground text-lg">
                  Create and manage your goals. Select them in the home page to start writing.
                </p>
              </div>
              <Button 
                onClick={() => setIsOpen(true)} 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md"
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
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first goal to start organizing your thoughts and tracking progress.
                </p>
                <Button onClick={() => setIsOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <Card key={goal.id} className="card-hover glow-effect relative overflow-hidden bg-card flex flex-col">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30"></div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold line-clamp-2 flex-1 mr-2">
                        {goal.title}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(goal)}
                          className="h-8 w-8 rounded-full hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(goal)}
                          className="h-8 w-8 rounded-full hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    {goal.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1">
                        {goal.description}
                      </p>
                    )}
                    
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>Created: {new Date(goal.createdAt).toLocaleDateString()}</span>
                        {goal.content && (
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Has content
                          </span>
                        )}
                      </div>
                      
                      <Link href="/">
                        <Button variant="outline" className="w-full">
                          <Mic className="h-4 w-4 mr-2" />
                          Work on this goal
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Goal Dialog */}
      <Dialog open={isOpen} onOpenChange={resetForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {editingGoal ? "Edit Goal" : "Create New Goal"}
            </DialogTitle>
            <DialogDescription>
              {editingGoal 
                ? "Update your goal details below."
                : "Define a new goal to track your progress and stay motivated."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" />
                Goal Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter your goal title"
                className="border-primary/20 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you want to achieve"
                className="border-primary/20 focus-visible:ring-primary min-h-[100px]"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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