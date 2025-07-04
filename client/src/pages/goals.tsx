import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Goal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Target, Sparkles, Clock, Tag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { GoalCard } from "@/components/GoalCard";
import { useTheme } from "@/components/theme-provider";
import { jsPDF } from "jspdf";

export default function Goals() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // Added preview state
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null); // Added selected goal state
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery<Goal[]>({
    refetchInterval: 30000, // Refetch every 30 seconds to keep data in sync
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Goal>) => {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create goal");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsOpen(false);
      toast({ 
        title: "Goal created successfully!",
        description: "Your new goal has been added to your goals list.",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create goal",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    });
  };

  const topLevelGoals = goals?.filter((goal) => !goal.parentId);

  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">Goals</h1>
              <p className="text-muted-foreground">Track your progress and achieve your ambitions</p>
            </div>
            <Button 
              onClick={() => setIsOpen(true)} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-primary/30 mb-4"></div>
              <div className="h-4 w-32 bg-primary/30 rounded mb-2"></div>
              <div className="h-3 w-24 bg-primary/20 rounded"></div>
            </div>
          </div>
        ) : topLevelGoals && topLevelGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topLevelGoals.map((goal) => (
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/30 border-muted">
            <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
            <p className="text-center text-muted-foreground mb-6 max-w-md">
              Create your first goal to start tracking your progress and achievements
            </p>
            <Button 
              onClick={() => setIsOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create your first goal
            </Button>
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create New Goal
              </DialogTitle>
              <DialogDescription>
                Define a new goal to track your progress and stay motivated
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-primary" />
                  Goal Title
                </label>
                <Input
                  name="title"
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
                  name="description"
                  placeholder="Describe what you want to achieve"
                  className="border-primary/20 focus-visible:ring-primary min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-primary" />
                </label>
                <Input
                  placeholder="health, learning, career (comma separated)"
                  className="border-primary/20 focus-visible:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {createMutation.isPending ? "Creating..." : "Create Goal"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{selectedGoal?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto">
              <div className="prose dark:prose-invert max-w-none">
                <h3>Description</h3>
                <div 
                  className="text-base whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedGoal?.description?.replace(
                      /<span data-preview[^>]*>(.*?)<\/span>/g,
                      (match) => {
                        // Make wrapper clickable
                        return match.replace(
                          'class="group cursor-pointer',
                          'class="group cursor-pointer inline-block'
                        );
                      }
                    ) || ''
                  }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    // Handle image clicks
                    const imgElement = target.closest('img');
                    if (imgElement) {
                      const url = imgElement.src;
                      if (url) window.open(url, '_blank');
                      return;
                    }
                    // Handle document clicks
                    const docElement = target.closest('span[data-type="document"]');
                    if (docElement) {
                      const url = docElement.getAttribute('data-url');
                      if (url) window.open(url, '_blank');
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}