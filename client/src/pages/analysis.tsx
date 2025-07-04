import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChartContainer } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

import type { UserActivity, ProjectTracking, Goal } from "@shared/schema";

// Simple tooltip component for charts
const ChartTooltipContent = (props: any) => {
  const { active, payload, label } = props;
  
  if (!active || !payload || !payload.length) {
    return null;
  }
  
  return (
    <div className="bg-background p-2 rounded-md border border-border shadow-md">
      <p className="font-medium">{label}</p>
      {payload.map((entry: any, index: number) => (
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalysisPage() {
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("week");
  const [startDate, setStartDate] = useState<Date>(() => startOfWeek(new Date()));
  const [endDate, setEndDate] = useState<Date>(() => endOfWeek(new Date()));

  // Fetch data
  const { 
    data: activities = [], 
    error: activitiesError, 
    isLoading: activitiesLoading 
  } = useQuery<UserActivity[]>({
  });

  const { 
    data: tracking = [], 
    error: trackingError, 
    isLoading: trackingLoading,
    refetch: refetchTracking 
  } = useQuery<ProjectTracking[]>({
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
    staleTime: 10000,
    select: (data) => {
      // Validate and transform data to ensure consistent format
      if (!Array.isArray(data)) {
        console.error("Expected array for tracking data but got:", typeof data);
        return [];
      }
      
      return data.map(item => ({
        ...item,
        totalTime: typeof item.totalTime === 'number' ? item.totalTime : 0,
        goalId: typeof item.goalId === 'number' ? item.goalId : 
               typeof item.goalId === 'string' ? parseInt(item.goalId, 10) : 0,
        sessionsCount: typeof item.sessionsCount === 'number' ? item.sessionsCount : 1
      }));
    }
  });

  const { 
    data: goals = [], 
    error: goalsError, 
    isLoading: goalsLoading 
  } = useQuery<Goal[]>({
  });
  
  // Log goals data when it changes
  useEffect(() => {
    console.log("Goals loaded successfully:", goals);
  }, [goals]);
  
  // Add effect to manually refetch data when component mounts
  useEffect(() => {
    console.log("Manually refetching tracking data on mount");
    refetchTracking();
  }, [refetchTracking]);

  // Debug logging
  console.log("Activities:", activities);
  console.log("Tracking:", tracking);
  console.log("Goals:", goals);
  console.log("Errors:", { activitiesError, trackingError, goalsError });
  console.log("Loading states:", { activitiesLoading, trackingLoading, goalsLoading });

  // Process data for charts
  const activityData = useMemo(() => {
    // Get days in the selected range
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Create data array with all days and initialize counts to 0
    const dayData = days.map(day => ({
      date: format(day, 'MMM dd'),
      recordings: 0,
      goals: 0,
      documents: 0,
      total: 0
    }));

    // Make sure activities is an array before iterating
    const activitiesArray = Array.isArray(activities) ? activities : [];

    // Count activities by type
    activitiesArray.forEach((activity: UserActivity) => {
      if (!activity.timestamp) return;

      const activityDate = new Date(activity.timestamp);
      if (activityDate < startDate || activityDate > endDate) return;

      const dayIndex = days.findIndex(day => 
        format(day, 'yyyy-MM-dd') === format(activityDate, 'yyyy-MM-dd')
      );

      if (dayIndex === -1) return;

      // Increment counts based on activity type with improved type matching
      if (activity.activityType?.includes('transcription') || activity.activityType?.includes('recording') || activity.activityType?.includes('speech')) {
        dayData[dayIndex].recordings += 1;
      } else if (activity.activityType?.includes('goal')) {
        dayData[dayIndex].goals += 1;
      } else if (activity.activityType?.includes('document') || activity.activityType?.includes('file')) {
        dayData[dayIndex].documents += 1;
      }

      dayData[dayIndex].total += 1;
    });

    return dayData;
  }, [activities, startDate, endDate]);

  // Process project tracking data for goal-focused visualization using real user data
  const projectTimeData = useMemo(() => {
    const projectTimes: Record<string, { goalId: number, name: string, minutes: number }> = {};
    
    // Ensure tracking is an array
    const trackingArray = Array.isArray(tracking) ? tracking : [];
    
    // Filter tracking data based on the selected date range
    const filteredTracking = trackingArray.filter((track: ProjectTracking) => {
      // Handle potential invalid dates gracefully
      try {
        const trackDate = track.dateGrouping ? 
          new Date(track.dateGrouping) : 
          track.lastActivity ? 
            new Date(track.lastActivity) : 
            null;
            
        if (!trackDate) return false;
        
        const start = startOfDay(new Date(startDate));
        const end = endOfDay(new Date(endDate));
        
        return trackDate >= start && trackDate <= end;
      } catch (e) {
        console.error('Error processing date:', e);
        return false;
      }
    });

    // Process actual user tracking data
    filteredTracking.forEach(track => {
      if (!track.goalId) return;

      const goalInfo = goals.find(g => g.id === track.goalId);
      const goalName = goalInfo?.title || `Goal ${track.goalId}`;

          goalId: track.goalId,
          name: goalName,
          minutes: 0
        };
      }

      // Add the actual minutes from user tracking data
    });

    // Map to array format for charts, with real data
    return Object.values(projectTimes)
      .map(({ name, minutes }) => ({
        name: name.length > 20 ? name.substring(0, 17) + '...' : name, // Truncate long names
        minutes: Math.round(minutes)
      }))
      .sort((a, b) => b.minutes - a.minutes)
      // Limit to top 10 goals for better readability
      .slice(0, 10);
  }, [tracking, goals, startDate, endDate]);

  // Calculate overall statistics with word count tracking
  const stats = useMemo(() => {
    // Ensure tracking is an array before performing operations
    const trackingArray = Array.isArray(tracking) ? tracking : [];
    
    const totalSessions = trackingArray.reduce((sum: number, t: ProjectTracking) => sum + (t.sessionsCount || 0), 0);
    const totalTime = trackingArray.reduce((sum: number, t: ProjectTracking) => sum + (t.totalTime || 0), 0);
    const averageSessionLength = totalSessions ? Math.round(totalTime / totalSessions) : 0;
    
    // Calculate approximate word count based on transcription content
    let totalWords = 0;
    
    // Estimate words from transcription content
    goals.forEach(goal => {
      if (goal.content?.journals) {
        goal.content.journals.forEach(journal => {
          const text = journal.text || '';
          // Strip HTML tags for cleaner word count
          const plainText = text.replace(/<[^>]*>/g, ' ');
          // Count words by splitting on whitespace
          const words = plainText.split(/\s+/).filter(w => w.length > 0);
          totalWords += words.length;
        });
      }
    });

    return {
      totalSessions,
      totalTime: Math.round(totalTime),
      averageSessionLength,
      totalWords,
      goalsCount: goals.length
    };
  }, [tracking, goals]);
  
  // Process time tracking data by date for the daily time chart
  const timeByDateData = useMemo(() => {
    // Ensure tracking is an array and has items
    const trackingArray = Array.isArray(tracking) ? tracking : [];
    if (!trackingArray.length) return [];
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Create a map of dates with initialized values
    const dateMap = new Map();
    days.forEach(day => {
      dateMap.set(format(day, 'yyyy-MM-dd'), {
        date: format(day, 'MMM dd'),
        totalMinutes: 0,
        sessionsCount: 0,
        // Store the full date for proper sorting
        fullDate: new Date(day)
      });
    });
    
    // Populate with actual user tracking data
    trackingArray.forEach((item: ProjectTracking) => {
      // Try to convert the dateGrouping string to a Date, handling potential format issues
      let trackingDate: Date;
      try {
        // Handle both ISO string format and simple date string
        trackingDate = new Date(item.dateGrouping || item.lastActivity || '');
        
        // If date is invalid, skip this item
        if (isNaN(trackingDate.getTime())) {
          console.warn('Invalid date format:', item.dateGrouping);
          return;
        }
      } catch (e) {
        console.error('Error parsing date:', item.dateGrouping, e);
        return;
      }
      
      
        // Use the actual user's time data in minutes
        dateData.totalMinutes += Math.round(item.totalTime || 0); 
        dateData.sessionsCount += item.sessionsCount || 0;
      }
    });
    
    // Convert to array and sort chronologically using the full date
    return Array.from(dateMap.values())
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  }, [tracking, startDate, endDate]);
  
  // Time heatmap data - shows when user is most active
  const timeHeatmapData = useMemo(() => {
    // Group activities by hour of day
    const hourlyActivity: Record<string, number> = {};
    
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      hourlyActivity[hour] = 0;
    }
    
    // Ensure activities is an array
    const activitiesArray = Array.isArray(activities) ? activities : [];
    
    // Count activities by hour
    activitiesArray.forEach((activity: UserActivity) => {
      if (!activity.timestamp) return;
      
      const date = new Date(activity.timestamp);
      const hour = date.getHours().toString().padStart(2, '0');
      
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });
    
    // Convert to array format for chart
    return Object.entries(hourlyActivity).map(([hour, count]) => ({
      hour: `${hour}:00`,
      activities: count
    })).sort((a, b) => a.hour.localeCompare(b.hour));
  }, [activities]);
  
  // Enhanced goal time and word tracking data
  const goalTimeData = useMemo(() => {
    const goalStats: Record<number, { 
      goalId: number, 
      title: string, 
      totalMinutes: number, 
      wordCount: number, 
      sessions: number 
    }> = {};
    
    // Ensure tracking and goals are arrays
    const trackingArray = Array.isArray(tracking) ? tracking : [];
    const goalsArray = Array.isArray(goals) ? goals : [];
    
    // Process tracking data
    trackingArray.forEach((track: ProjectTracking) => {
      if (!track.goalId) return;
      
      const goal = goalsArray.find(g => g.id === track.goalId);
      if (!goal) return;
      
      if (!goalStats[track.goalId]) {
        goalStats[track.goalId] = {
          goalId: track.goalId,
          title: goal.title,
          totalMinutes: 0,
          wordCount: 0,
          sessions: 0
        };
      }
      
      goalStats[track.goalId].totalMinutes += Math.round((track.totalTime || 0) / 60);
      goalStats[track.goalId].sessions += track.sessionsCount || 0;
    });
    
    // Add word counts from goal content
    goalsArray.forEach(goal => {
      if (!goal.id || !goalStats[goal.id]) return;
      
      if (goal.content?.journals) {
        goal.content.journals.forEach(journal => {
          const text = journal.text || '';
          // Strip HTML tags for cleaner word count
          const plainText = text.replace(/<[^>]*>/g, ' ');
          // Count words by splitting on whitespace
          const words = plainText.split(/\s+/).filter(w => w.length > 0);
          goalStats[goal.id].wordCount += words.length;
        });
      }
    });
    
    return Object.values(goalStats).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [tracking, goals]);

  // Handle date range changes
  const handleDateRangeChange = (range: "week" | "month" | "year") => {
    const today = new Date();
    let start, end;

    if (range === "week") {
      start = startOfWeek(today);
      end = endOfWeek(today);
    } else if (range === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }

    setStartDate(start);
    setEndDate(end);
    setDateRange(range);
  };

  // Loading state
  if (activitiesLoading || trackingLoading || goalsLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="py-16 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg">Loading your analysis data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Debug early exit condition
  console.log("Checking if we should show empty state:");
  console.log("- Activities:", activities?.length || 0); 
  console.log("- Tracking:", tracking?.length || 0);
  console.log("- Goals:", goals?.length || 0);
  
  // Only show empty data state if we truly have no data at all
  // (goals can exist without activities, and we should still show the page in that case)
  if ((!goals || goals.length === 0) && 
      (!activities || activities.length === 0)) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="py-16">
          <div className="text-center max-w-2xl mx-auto bg-card p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">No Analysis Data Available</h2>
            <div className="text-lg text-muted-foreground mb-6">
              {activitiesError?.message || trackingError?.message || goalsError?.message || 
                'To see your analytics, create goals, record voice notes, or add journal entries'}
            </div>
            <div className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Get Started</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Create your first goal on the home page</li>
                  <li>Record voice notes using the voice recorder</li>
                  <li>Add journal entries to your goals</li>
                  <li>Check back here to see your progress analytics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main data view with charts
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Activity Analysis</h1>
        <p className="text-muted-foreground">Track your productivity and analyze your goal progress</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Card className="bg-purple-950/90 border-purple-900 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle>Statistics Summary</CardTitle>
              <CardDescription>Overview of your productivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-purple-900/40 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-3xl font-bold">{stats.totalSessions}</p>
                </div>
                <div className="bg-purple-900/40 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Time</p>
                  <p className="text-3xl font-bold">{stats.totalTime} min</p>
                </div>
                <div className="bg-purple-900/40 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Avg. Session</p>
                  <p className="text-3xl font-bold">{stats.averageSessionLength} min</p>
                </div>
                <div className="bg-purple-900/40 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Words</p>
                  <p className="text-3xl font-bold">{stats.totalWords.toLocaleString()}</p>
                </div>
                <div className="bg-purple-900/40 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Active Goals</p>
                  <p className="text-3xl font-bold">{stats.goalsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 lg:max-w-[300px]">
          <Card className="bg-purple-950/90 border-purple-900 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle>Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className={`px-3 py-2 rounded-full text-sm ${dateRange === 'week' ? 'bg-purple-700 text-white' : 'bg-purple-800/50 text-purple-100'}`}
                    onClick={() => handleDateRangeChange('week')}
                  >
                    Week
                  </button>
                  <button
                    className={`px-3 py-2 rounded-full text-sm ${dateRange === 'month' ? 'bg-purple-700 text-white' : 'bg-purple-800/50 text-purple-100'}`}
                    onClick={() => handleDateRangeChange('month')}
                  >
                    Month
                  </button>
                  <button
                    className={`px-3 py-2 rounded-full text-sm ${dateRange === 'year' ? 'bg-purple-700 text-white' : 'bg-purple-800/50 text-purple-100'}`}
                    onClick={() => handleDateRangeChange('year')}
                  >
                    Year
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="mb-2 block">Start Date</Label>
                    <div className="w-full border-purple-700 bg-purple-900/30 rounded-md">
                      <DatePicker 
                        date={startDate} 
                        setDate={setStartDate}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">End Date</Label>
                    <div className="w-full border-purple-700 bg-purple-900/30 rounded-md">
                      <DatePicker 
                        date={endDate} 
                        setDate={setEndDate}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="time-analysis">
        <TabsList className="mb-4 bg-purple-900/70 p-1 rounded-full">
          <TabsTrigger value="time-analysis" className="rounded-full data-[state=active]:bg-purple-950">Time Analysis</TabsTrigger>
          <TabsTrigger value="goal-details" className="rounded-full data-[state=active]:bg-purple-950">Goal Details</TabsTrigger>
        </TabsList>

        <TabsContent value="time-analysis">
          <Card className="bg-purple-950/90 border-purple-900 shadow-xl">
            <CardHeader>
              <CardTitle>Time Analysis</CardTitle>
              <CardDescription>Daily time spent and goal distribution</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Time Consumption Chart - Enhanced with Responsive Container */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Daily Time Spent</h3>
                <ChartContainer className="h-[400px]">
                  {!tracking.length ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-card/50 rounded-md z-10">
                      <div className="text-center p-6">
                        <p className="text-lg font-medium">No time tracking data</p>
                        <p className="text-sm mt-2">Track goal activities to see data</p>
                      </div>
                    </div>
                  ) : (
                    <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                      <RechartsPrimitive.LineChart
                        data={timeByDateData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" stroke="#2D2B4E" />
                        <RechartsPrimitive.XAxis
                          stroke="#A78BFA"
                          tick={{ fill: '#E0E0E0' }}
                        />
                        <RechartsPrimitive.YAxis
                          stroke="#A78BFA"
                          tick={{ fill: '#E0E0E0' }}
                          label={{
                            value: 'Minutes',
                            angle: -90,
                            position: 'insideLeft',
                            fill: '#E0E0E0'
                          }}
                        />
                        <RechartsPrimitive.Tooltip
                          content={<ChartTooltipContent />}
                          wrapperStyle={{ background: '#1E1B4B' }}
                        />
                        <RechartsPrimitive.Legend />
                        <RechartsPrimitive.Line
                          type="monotone"
                          stroke="#A78BFA"
                          strokeWidth={2}
                          dot={{ fill: '#7C3AED', strokeWidth: 2 }}
                        />
                        <RechartsPrimitive.Bar 
                          name="Total Time"
                          fill="#8884d8"
                          radius={[4, 4, 0, 0]}
                          fillOpacity={0.3}
                        />
                      </RechartsPrimitive.LineChart>
                    </RechartsPrimitive.ResponsiveContainer>
                  )}
                </ChartContainer>
              </div>

              {/* Goal Time Distribution - Enhanced with Responsive Container */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Goal Time Breakdown</h3>
                <ChartContainer className="h-[400px]">
                  {!tracking.length ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-card/50 rounded-md z-10">
                      <div className="text-center p-6">
                        <p className="text-lg font-medium">No goal time data</p>
                        <p className="text-sm mt-2">Track activities on goals to see this chart</p>
                      </div>
                    </div>
                  ) : (
                    <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                      <RechartsPrimitive.BarChart
                        data={projectTimeData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                      >
                        <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" stroke="#2D2B4E" />
                        <RechartsPrimitive.XAxis
                          type="number"
                          stroke="#A78BFA"
                          tick={{ fill: '#E0E0E0' }}
                        />
                        <RechartsPrimitive.YAxis
                          type="category"
                          stroke="#A78BFA"
                          tick={{ fill: '#E0E0E0' }}
                          width={120}
                        />
                        <RechartsPrimitive.Tooltip
                          content={<ChartTooltipContent />}
                          wrapperStyle={{ background: '#1E1B4B' }}
                        />
                        <RechartsPrimitive.Legend />
                        <RechartsPrimitive.Bar
                          fill="#A78BFA"
                          radius={[0, 4, 4, 0]}
                          background={{ fill: '#2D2B4E', radius: 4 }}
                        >
                          {projectTimeData.map((entry, index) => (
                            <RechartsPrimitive.Cell
                              fill={`hsl(267, ${70 + index * 10}%, 70%)`}
                            />
                          ))}
                        </RechartsPrimitive.Bar>
                      </RechartsPrimitive.BarChart>
                    </RechartsPrimitive.ResponsiveContainer>
                  )}
                </ChartContainer>
              </div>

              {/* Activity Patterns Section - New - Fixed Layout */}
              <div className="lg:col-span-2 mb-6">
                <h3 className="text-lg font-semibold mb-4">Activity Patterns</h3>
                <Card className="bg-purple-900/30 border-purple-800">
                  <CardContent className="pt-4 pb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <h4 className="text-md font-medium mb-2">Most Active Days</h4>
                        <div className="grid grid-cols-7 gap-1">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                            // Count activities by day of week using actual user data
                            const dayCount = activities.filter(a => {
                              if (!a.timestamp) return false;
                              const date = new Date(a.timestamp);
                              return date.getDay() === i;
                            }).length;
                            const maxCount = Math.max(...[0, 1, 2, 3, 4, 5, 6].map(dayIndex => 
                              activities.filter(a => {
                                if (!a.timestamp) return false;
                                const date = new Date(a.timestamp);
                                return date.getDay() === dayIndex;
                              }).length
                            ));
                            const intensity = maxCount > 0 ? Math.min(dayCount / maxCount * 0.8, 0.8) + 0.2 : 0.2;
                            
                            return (
                                <div className="text-xs mb-1">{day}</div>
                                <div 
                                  className="h-8 rounded-md"
                                  style={{ 
                                    backgroundColor: `rgba(167, 139, 250, ${intensity})`,
                                    border: '1px solid rgba(167, 139, 250, 0.3)'
                                  }}
                                  title={`${dayCount} activities`}
                                ></div>
                                <div className="text-xs mt-1">{dayCount}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex-1">
                        <h4 className="text-md font-medium mb-2">Activity Types</h4>
                        <div className="space-y-3">
                          {[
                            { type: 'recordings', check: (a: UserActivity) => a.activityType?.includes('transcription') || a.activityType?.includes('recording') || a.activityType?.includes('speech') },
                            { type: 'goals', check: (a: UserActivity) => a.activityType?.includes('goal') },
                            { type: 'documents', check: (a: UserActivity) => a.activityType?.includes('document') || a.activityType?.includes('file') }
                          ].map(({ type, check }) => {
                            // Count activities by type using actual user data
                            const count = activities.filter(check).length;
                            const totalActivities = activities.length;
                            const percentage = totalActivities > 0 ? (count / totalActivities) * 100 : 0;
                            
                            return (
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="capitalize">{type}</span>
                                  <span>{count}</span>
                                </div>
                                <div className="w-full bg-purple-900/30 rounded-full h-2.5">
                                  <div 
                                    className="h-2.5 rounded-full" 
                                    style={{
                                      width: `${percentage}%`,
                                      background: type === 'recordings' ? '#C4B5FD' : 
                                                type === 'goals' ? '#A78BFA' : '#8B5CF6'
                                    }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        
        <TabsContent value="goal-details">
          <Card className="bg-purple-950/90 border-purple-900 shadow-xl">
            <CardHeader>
              <CardTitle>Goal Details</CardTitle>
              <CardDescription>
                Detailed breakdown of time spent and words written per goal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <ChartContainer className="h-[400px] relative" config={{
                  minutes: { theme: { light: "#a78bfa", dark: "#a78bfa" } },
                  words: { theme: { light: "#f9a8d4", dark: "#f9a8d4" } }
                }}>
                  {goalTimeData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-card/50 rounded-md z-10">
                      <div className="text-center p-6">
                        <p className="text-lg font-medium">No goal data available</p>
                        <p className="text-sm mt-2">Add journal entries to your goals to see analytics</p>
                      </div>
                    </div>
                  ) : (
                    <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                      <RechartsPrimitive.BarChart 
                        data={goalTimeData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" stroke="#2D2B4E" />
                        <RechartsPrimitive.XAxis 
                          stroke="#A78BFA"
                          tick={{ fill: '#E0E0E0', fontSize: 12 }}
                        />
                        <RechartsPrimitive.YAxis 
                          yAxisId="left" 
                          orientation="left" 
                          stroke="#A78BFA"
                          tick={{ fill: '#E0E0E0' }}
                          label={{
                            value: 'Minutes',
                            angle: -90,
                            position: 'insideLeft',
                            fill: '#E0E0E0'
                          }}
                        />
                        <RechartsPrimitive.YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          stroke="#F9A8D4"
                          tick={{ fill: '#E0E0E0' }}
                          label={{
                            value: 'Words',
                            angle: 90,
                            position: 'insideRight',
                            fill: '#E0E0E0'
                          }}
                        />
                        <RechartsPrimitive.Tooltip content={<ChartTooltipContent />} />
                        <RechartsPrimitive.Legend />
                        <RechartsPrimitive.Bar 
                          yAxisId="left"
                          name="Minutes Spent" 
                          fill="#A78BFA" 
                          radius={[4, 4, 0, 0]}
                        />
                        <RechartsPrimitive.Bar 
                          yAxisId="right"
                          name="Word Count" 
                          fill="#F9A8D4" 
                          radius={[4, 4, 0, 0]}
                        />
                      </RechartsPrimitive.BarChart>
                    </RechartsPrimitive.ResponsiveContainer>
                  )}
                </ChartContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                {goalTimeData.map(goal => (
                    <CardHeader className="pb-2 bg-purple-800/50">
                      <CardTitle className="text-lg truncate">{goal.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Time Spent:</p>
                          <p className="font-medium text-purple-200">{goal.totalMinutes} minutes</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Word Count:</p>
                          <p className="font-medium text-pink-200">{goal.wordCount.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Sessions:</p>
                          <p className="font-medium text-blue-200">{goal.sessions}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Words/Min:</p>
                          <p className="font-medium text-green-200">
                            {goal.totalMinutes > 0 
                              ? (goal.wordCount / goal.totalMinutes).toFixed(1) 
                              : "0"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}