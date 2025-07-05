import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Target, Sparkles, Clock, Tag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "@/components/theme-provider";
import { Link } from "wouter";

export default function Goals() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

  // Mock goals data
  const mockGoals = [
    {
      id: 1,
      title: "Complete project proposal",
      description: "Finalize the project proposal document by the end of the week",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: "Learn React hooks",
      description: "Master useEffect, useState, and useContext hooks",
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      title: "Daily meditation",
      description: "Practice mindfulness meditation for 10 minutes every day",
      createdAt: new Date().toISOString()
    }
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsOpen(false);
    toast({ 
      title: "Goal created successfully!",
      description: "Your new goal has been added to your goals list.",
      variant: "default"
    });
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockGoals.map((goal) => (
            <div key={goal.id} className="card-hover glow-effect relative overflow-hidden bg-card card-hover flex flex-col w-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30"></div>
              <div className="py-3 px-4 flex-shrink-0 border-b">
                <div className="flex flex-col w-full">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2 cursor-pointer group max-w-[75%]">
                      <div className="w-9"></div>
                      <div className="max-w-full overflow-hidden">
                        <h3 className="text-base font-medium truncate transition-colors duration-300 group-hover:text-primary card-title">
                          {goal.title}
                        </h3>
                        {goal.description && (
                          <button className="text-sm text-muted-foreground mt-1 flex items-center hover:text-primary transition-colors duration-300 group-hover:text-primary/80 card-content max-w-full">
                            <span className="line-clamp-1 truncate">{goal.description}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-3 pb-2 overflow-y-auto flex-grow border-t mt-2 card-content px-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button variant="outline" className="flex items-center gap-2 btn-hover-effect border-primary/30 hover:bg-primary/5">
                    <Clock className="h-4 w-4 text-primary" />
                    Set Date Range
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

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
                  Tags
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
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Create Goal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}