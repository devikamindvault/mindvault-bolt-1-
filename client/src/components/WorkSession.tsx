import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, Play, Pause, StopCircle, Clock, BarChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Goal } from "@shared/schema";

interface WorkSessionProps {
  goal: Goal;
  onCompleted?: () => void;
}

export function WorkSession({ goal, onCompleted }: WorkSessionProps) {
  // Use localStorage to persist timer state across page navigation
  const [isRunning, setIsRunning] = useState(() => {
    try {
      const savedState = localStorage.getItem(`timer_running_${goal.id}`);
      return savedState === 'true';
    } catch (e) {
      return false;
    }
  });
  
  const [seconds, setSeconds] = useState(() => {
    try {
      const savedSeconds = localStorage.getItem(`timer_seconds_${goal.id}`);
      return savedSeconds ? parseInt(savedSeconds, 10) : 0;
    } catch (e) {
      return 0;
    }
  });
  
  const [totalTime, setTotalTime] = useState(0);
  const queryClient = useQueryClient();

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Save timer state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(`timer_running_${goal.id}`, isRunning.toString());
    } catch (e) {
      console.error('Error saving timer running state to localStorage:', e);
    }
  }, [isRunning, goal.id]);
  
  // Save seconds to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(`timer_seconds_${goal.id}`, seconds.toString());
    } catch (e) {
      console.error('Error saving timer seconds to localStorage:', e);
    }
  }, [seconds, goal.id]);
  
  // Handle timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning]);

  // Mutation for tracking time
  const trackTimeMutation = useMutation({
    mutationFn: (data: { goalId: number; totalTime: number; dateGrouping: string }) =>
      apiRequest("POST", "/api/user/project-tracking", data),
    onSuccess: () => {
      // Invalidate related queries to refresh data
      
      // Show success toast
      toast({
        title: "Session Completed",
        description: `Tracked ${Math.round(totalTime / 60)} minutes for goal "${goal.title}"`,
        variant: "default"
      });
      
      if (onCompleted) {
        onCompleted();
      }
    },
    onError: (error: any) => {
      console.error("Error tracking time:", error);
      
      // Extract detailed error message if possible
      let errorMessage = "Failed to save your work session. Please try again.";
      
      if (error?.response?.data) {
        try {
          const errorData = typeof error.response.data === 'string' 
            ? JSON.parse(error.response.data) 
            : error.response.data;
            
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = error.response.data || errorMessage;
        }
      }
      
      toast({
        title: "Error Saving Session",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Start the timer
  const startTimer = () => {
    setIsRunning(true);
    toast({
      title: "Session Started",
      description: "Timer is now running for your work session",
    });
  };

  // Pause the timer
  const pauseTimer = () => {
    setIsRunning(false);
    toast({
      title: "Session Paused",
      description: "You can resume your session any time",
    });
  };

  // End the work session and record time
  const endSession = useCallback(() => {
    setIsRunning(false);
    const finalTime = seconds;
    setTotalTime(finalTime);
    
    if (finalTime < 10) {
      toast({
        title: "Session Too Short",
        description: "Work sessions should be at least 10 seconds to be tracked",
        variant: "destructive"
      });
      return;
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    
    // Log debugging info to help identify the goal ID issue
    console.log("Tracking time for goal:", goal);
    
    // Goal ID must be a valid positive integer that exists in the database
    if (!goal.id) {
      toast({
        title: "Error",
        description: "Invalid goal ID. Cannot track time.",
        variant: "destructive"
      });
      return;
    }
    
    // Send the tracking data with proper type conversion
    const goalIdNumber = typeof goal.id === 'string' ? parseInt(goal.id, 10) : goal.id;
    
    console.log("Submitting work session data:", {
      goalId: goalIdNumber,
      totalTime: finalTime,
      dateGrouping: today
    });
    
    // Add more detailed error handling for the tracking request
    try {
      trackTimeMutation.mutate({
        goalId: goalIdNumber,
        totalTime: finalTime,
        dateGrouping: today
      });
      
      // Also add a user activity entry to ensure it's recorded in the activity feed
      // We'll use a more robust approach with proper error handling
      try {
        apiRequest("POST", "/api/user/activities", {
          activityType: 'work_session',
          details: JSON.stringify({
            goalId: goalIdNumber,
            totalTime: finalTime
          })
        }).then(() => {
          console.log("Activity logged successfully");
        }).catch(err => {
          console.error("Error logging activity:", err);
        });
      } catch (error) {
        console.error("Failed to initiate activity logging:", error);
      }
    } catch (err) {
      console.error("Error initiating work session tracking:", err);
      toast({
        title: "Error",
        description: "Failed to save work session. Please try again.",
        variant: "destructive"
      });
    }
    
    // Reset timer and clear localStorage
    setSeconds(0);
    try {
      localStorage.removeItem(`timer_seconds_${goal.id}`);
      localStorage.removeItem(`timer_running_${goal.id}`);
    } catch (e) {
      console.error('Error clearing timer data from localStorage:', e);
    }
  }, [seconds, goal.id, trackTimeMutation, toast, queryClient]);

  return (
    <Card className="bg-purple-950/80 border-purple-800 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Work Session
          </span>
          <Badge variant="outline" className="bg-purple-900/50">
            {isRunning ? "Active" : "Ready"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-6">
          <div className="text-4xl font-bold mb-2 text-purple-100">
            {formatTime(seconds)}
          </div>
          <div className="text-sm text-muted-foreground">
            {isRunning ? "Time is being tracked" : "Start timer to track your work"}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-center">
        {!isRunning ? (
          <Button
            onClick={startTimer}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
        ) : (
          <Button
            onClick={pauseTimer}
            variant="outline"
            className="border-purple-700"
          >
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
        )}
        <Button
          onClick={endSession}
          variant="destructive"
          disabled={seconds === 0}
          className="bg-pink-700 hover:bg-pink-800 border-none"
        >
          <StopCircle className="mr-2 h-4 w-4" />
          End & Save
        </Button>
      </CardFooter>
    </Card>
  );
}