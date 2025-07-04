import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, BarChart2, Target, Timer } from "lucide-react";
import { format } from "date-fns";
import { WorkSession } from "@/components/WorkSession";
import { useToast } from "@/hooks/use-toast";
import type { Goal, ProjectTracking } from "@shared/schema";

export default function GoalDetailPage() {
  const [_, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch goal data
  const { data: goal, isLoading: goalLoading, error: goalError } = useQuery<Goal>({
    enabled: !!id
  });
  
  // Fetch tracking data for this goal
  const { data: trackingData, isLoading: trackingLoading, error: trackingError } = useQuery<ProjectTracking[]>({
    enabled: !!id,
    refetchOnWindowFocus: true,
    retry: 3,
    refetchInterval: 15000, // Refresh data every 15 seconds to help see updates
    staleTime: 10000
  });
  
  // Calculate stats
  const stats = useMemo(() => {
    if (!trackingData) return { totalTime: 0, sessions: 0, avgTimePerSession: 0 };
    
    const goalTracking = trackingData.filter(t => t.goalId === Number(id));
    const totalTime = goalTracking.reduce((sum, t) => sum + (t.totalTime || 0), 0);
    const sessions = goalTracking.length;
    const avgTimePerSession = sessions > 0 ? Math.round(totalTime / sessions) : 0;
    
    return { totalTime, sessions, avgTimePerSession };
  }, [trackingData, id]);
  
  // Format time function (seconds to HH:MM:SS or MM:SS)
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Handle session completion
  const handleSessionCompleted = () => {
    // Refetch tracking data
    
    toast({
      title: "Session Recorded",
      description: "Your work session has been tracked successfully!",
    });
  };
  
  // If there's an error loading the goal
  if (goalError) {
    return (
      <div className="container max-w-5xl mx-auto p-6">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => setLocation("/goals")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Goals
        </Button>
        
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">Failed to load goal details. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If the goal is loading
  if (goalLoading || !goal) {
    return (
      <div className="container max-w-5xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted rounded mb-6"></div>
          <div className="h-12 w-3/4 bg-muted rounded mb-4"></div>
          <div className="h-8 w-1/2 bg-muted rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-40 bg-muted rounded"></div>
            <div className="h-40 bg-muted rounded"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-5xl mx-auto p-6">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => setLocation("/goals")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Goals
      </Button>
      
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{goal.title}</h1>
          {goal.description && (
            <p className="text-muted-foreground mt-2">{goal.description}</p>
          )}
          <div className="flex items-center mt-4 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Created {goal.createdAt ? format(new Date(goal.createdAt), 'MMMM d, yyyy') : 'recently'}</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-400" />
                Total Time Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatTime(stats.totalTime)}</p>
              <p className="text-muted-foreground text-sm mt-1">
                Across {stats.sessions} session{stats.sessions !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Timer className="h-4 w-4 mr-2 text-green-400" />
                Average Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatTime(stats.avgTimePerSession)}</p>
              <p className="text-muted-foreground text-sm mt-1">
                Per work session
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Target className="h-4 w-4 mr-2 text-purple-400" />
                Goal Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{goal.active ? "Active" : "Inactive"}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {goal.active ? "Currently tracking" : "Not tracking"}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-card/5 border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2 text-primary" />
              Recent Work Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trackingLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-full bg-muted rounded mb-4"></div>
                <div className="h-8 w-full bg-muted rounded mb-4"></div>
              </div>
            ) : trackingData && trackingData.filter(t => t.goalId === Number(id)).length > 0 ? (
              <div className="space-y-2">
                {trackingData
                  .filter(t => t.goalId === Number(id))
                  .sort((a, b) => new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime())
                  .slice(0, 5)
                  .map((session, index) => (
                      <div>
                        <p className="font-medium text-sm">
                          {format(new Date(session.lastActivity || new Date()), 'MMM d, yyyy')}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {session.dateGrouping}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatTime(session.totalTime || 0)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No work sessions tracked yet. Use the timer below to record your first session.
              </p>
            )}
          </CardContent>
        </Card>
        
        <WorkSession goal={goal} onCompleted={handleSessionCompleted} />
      </div>
    </div>
  );
}