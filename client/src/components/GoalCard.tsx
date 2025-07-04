import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trash2, EditIcon, Plus, ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Calendar as CalendarIcon, Download, Search, Timer } from "lucide-react";
import Calendar from 'react-calendar';
// Import our custom calendar styles instead of the default ones
// import 'react-calendar/dist/Calendar.css';
import { jsPDF } from 'jspdf';
import { format, parse, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Goal } from "@shared/schema";
import { Link } from "wouter";
import DOMPurify from 'dompurify';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useTheme } from "@/components/theme-provider";

// Helper function to create image thumbnails for PDF
// Base64 placeholder image to use when thumbnail creation fails
const PLACEHOLDER_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFHElEQVR4nO2dW4hcRRCGK+AFjddEUTcRFVzjBQXBB0GJRlwRJauCF/BBfNCIruAFQcGYqPgmuuiDEBfxQYl3jYqKGMUbRFFUiIp4iRKJt3iJGjV+sAUzOHZ7pqfPmTOnur8Pmpede/+rZ7qrq2t6IYQQQgghhBBCtMG+km6VtEHSL5J2lmKL/9ss6RZJ+2RXeoCkayT9UCGCOrHF+zdL6me+uQskfV0jgCb5StL5mW/ydEmbGgjQJttTf4O+1lYbF58nmbRsjdTbXvtGGnzZPSX9bgj/h6QjMt/oMsMNPJH55s4xXPzZmW/udcMN/CXpvMw3d6ek5w03MC/zzb1nuPgvSroo882tNdzAR5lvbMVzhjdkYeYbmy1pp+Hiz818c0dLesfwBrZLOiLzzc1N+VYbz5KjM99cX9LlkrZZbkLS5DRX1HCtpLcM17415Yuvss68CNiu8XFWGJfFXDdw/wRlq9vSNW9uetTc4OsK4eolXZeOp3t9P/8bpMGrXzuuHLVNL02x5fmwRuN3VlzflXRSC9fuS7oi5X1VD/2epKP+b9D6im/8s6QrJc0Y8ZqHS3ow5aaqvvl3SjrZMugXNR72G1OCb1TZ5ZmSHk6D8aZ5sjwfzNR4oi7/vEXSwZa3enKqPdWN2f9KekHSBZJmNbjG4ZLuSjmruvxSHf8aZ+yXMkV1D31RSu6aGu9OTcJ7Pd3UppldXf6WdHXdjXq1gYe/JmWXR/EwZ6d5oqr+qqr8ONXXapmdBjdtpE1WSLohjbtdioNTKcVrElRXz5KrRg3Iq0YT9JqUQR03+JKelPRUqiWNGwcN/u47FYlIlTgyDS6nTeCpg44rzMzS5HNvC6mkG6YZN3yYoYC8ZBDQ05L2zDRgvizpM4OAPpE0K4OArk1FpSaguyXt1XFAdw+tPTQJ6FZJszsMaI6kWwwCuqnLgO6rKQ3UCehqSXt3ENDZA0FYBfRYVwG92EDl1yqgjyTtXTGn1AX0dFdpk9UKcZeZlfK5TS0WFCwDusryAVk2H/bbTSYnTQN6wDKgh6xKA5bdjwfSOM8yoE2WKz2vGAWz0TKga6wCsmzCaB3QjS0FtCT9nVVAn1o2YZ6tenKaiC1fLa9bBnSZRUBHGe6PdJVZlgF9adkteHqMm1AuSFmslfbRZ11v1KuGa0oe2B/KQI1GnLhfgf1eE8jthhPwUY5KFK9aBvagxe6hjVYBWRwhZXWE1K/pWlTSx1zDbfptqTxjJaCrxnzjPcslI4sFxQdHCOihMQzo3KYCsszUZzUY0EdphtIyoG8tC4pW65B1b793MAjqk/TSyiqgDyUdaDw/1DqgJqsVXzSY9v6S9LxRQF+kqJocIWXV/djQQn2q7UbOFsue1/dGK7F1+VnSM5KOS5Ugq9TEfN9ybm/Smi8GZ59aLWC+X9EIfK+BQ2n+7HouOC8VsGxXQ/8+w2pqg5Jmz/h/Q9LStL/eCzP5h6e1Ty9h9Lw/5c5o7eD8FJRFUNvS7GK5Nt3zfKzlcXS3+cN5gWRgDJMWq22yQgIDGEECAxhBAgMYQQIDGEECAxhBAgMYQQIDGEECAxhBAgMYQQIDGEGqIIFv2BYkMIARJDCKIBVBwiKnRQIDmBXJ5rBlE+a9pgdUWbx6+aXp+/QLJqeZ4yTOVsEqpyjjON8xggQGMIIEBjCCBAYwggQGMIIEBjCCBAYwggQGMIIEBjCCBAYwggQGMIIEBjCCBMb0RAiBVAQhhBBCCCGEEKLn/APxBzLU2I1YbwAAAABJRU5ErkJggg==";

const DOC_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5ElEQVR4nO2UQQ6CMBBFf40ncOIKOjrqJYwH4QjqDXRTBxcP4klYdXIy0dFgoKVpSAgJQ/8YoKWUAQYXX/KShmbe79Aw0L96cgAeQCKiG7AGXFMFQmAnwTugNAksgYsEP4BGJH4GnhK0EfiyeCNBe+AkQXPgKsHRO/FXKS6AswTcgRA4SPLYniwSkTXQk4SJHP+jiGbAVEQzEU0keVcldwE6SXSW4B3QmoiHspHEIppL8Ku4Kx7IRh4SvAPWJuIAqCW5kuShnK9lEh8koJHj8jOgcwEiuVlHleyYaq0L0JfVPU1wI9PEPkAfOErCj5aokWObyya+7qc1zrebellQAAAABJRU5ErkJggg==";

// Simplified and more robust thumbnail creator - based on TranscriptionDownloader approach
const createThumbnail = async (url: string, maxWidth: number, maxHeight: number): Promise<string> => {
  // Return a promise that always resolves (never rejects) for stability
  return new Promise((resolve) => {
    // Handle missing or invalid URL
    if (!url) {
      console.log("No URL provided for thumbnail");
      return resolve(PLACEHOLDER_IMAGE);
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // Set a timeout to handle stalled image loading (shorter timeout for better performance)
    const timeout = setTimeout(() => {
      console.log("Image load timeout for:", url);
      resolve(PLACEHOLDER_IMAGE);
    }, 2000);
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        // Basic validation
        if (img.width === 0 || img.height === 0) {
          return resolve(PLACEHOLDER_IMAGE);
        }
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(PLACEHOLDER_IMAGE);
        }
        
        // Calculate dimensions while preserving aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * maxHeight / height);
            height = maxHeight;
          }
        }
        
        // Ensure minimum size
        width = Math.max(width, 10);
        height = Math.max(height, 10);
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image and get data URL in a single try block
        try {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        } catch (error) {
          console.error("Error processing canvas:", error);
          resolve(PLACEHOLDER_IMAGE);
        }
      } catch (error) {
        console.error("General error in thumbnail creation:", error);
        resolve(PLACEHOLDER_IMAGE);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      console.error("Image loading error for:", url);
      resolve(PLACEHOLDER_IMAGE);
    };
    
    // Attempt to load the image with absolute URL and cache-busting
    try {
      // Make URL absolute if needed
      let imageUrl = url;
      if (!url.startsWith('http') && !url.startsWith('data:')) {
        const base = window.location.origin;
        imageUrl = base + (url.startsWith('/') ? '' : '/') + url;
      }
      
      // Add cache-busting query parameter
      img.src = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
    } catch (e) {
      clearTimeout(timeout);
      console.error("Error setting image src:", e);
      resolve(PLACEHOLDER_IMAGE);
    }
  });
};

// Note: DOC_ICON is already defined above

interface GoalCardProps {
  goal: Goal;
  level?: number;
  onPreviewClick?: () => void;
}

export function GoalCard({ goal, level = 0, onPreviewClick }: GoalCardProps) {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState({ ...goal });
  const [showAddSub, setShowAddSub] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const saved = localStorage.getItem(`filter_start_${goal.id}`);
    return saved ? new Date(saved) : null;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const saved = localStorage.getItem(`filter_end_${goal.id}`);
    return saved ? new Date(saved) : null;
  });
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  // Define an interface for journal entries
  interface JournalEntry {
    goalId: string | undefined;
    text: string;
    date: string;
  }

  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (startDate && endDate) {
      try {
        const entries: JournalEntry[] = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        const filtered = entries.filter((entry: JournalEntry) => {
          if (!entry.date || entry.goalId !== goal.id.toString()) return false;
          const entryDate = new Date(entry.date);
          return isWithinInterval(entryDate, {
            start: startOfDay(startDate),
            end: endOfDay(endDate)
          });
        });
        setFilteredEntries(filtered);
      } catch (error) {
        console.error('Error filtering entries:', error);
        setFilteredEntries([]);
      }
    }
  }, [startDate, endDate, goal.id]);
  const [searchDate, setSearchDate] = useState<string | null>(null); // Added state for search date
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allGoals } = useQuery<Goal[]>({
  });

  const subGoals = allGoals?.filter((g) => g.parentId === goal.id);
  const hasSubGoals = subGoals && subGoals.length > 0;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/goals/${goal.id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted!", description: "Goal removed successfully" });
    },
    onError: () => {
      toast({
        title: "Error!",
        description: "Failed to delete goal",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/goals/${goal.id}`, {
        title: editedGoal.title,
        description: editedGoal.description,
      }),
    onSuccess: () => {
      setIsEditing(false);
      toast({ title: "Updated!", description: "Goal saved successfully" });
    },
  });

  const addSubMutation = useMutation({
    mutationFn: (newSub: Partial<Goal>) =>
      apiRequest("POST", "/api/goals", {
        ...newSub,
        parentId: goal.id,
      }),
    onSuccess: () => {
      setShowAddSub(false);
      toast({ title: "Success!", description: "Sub-goal added" });
    },
  });

  const handleSearch = () => {
    if (!startDate || !endDate) return;

    try {
      const entries: JournalEntry[] = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      // Get all entries in date range for this goal
      const filtered = entries.filter((entry: JournalEntry) => {
        if (!entry.date || entry.goalId !== goal.id.toString()) return false;
        const entryDate = new Date(entry.date);
        return isWithinInterval(entryDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate)
        });
      });

      // For displaying purposes, we still want to set all filtered entries
      // so users can see all updates in the date range
      setFilteredEntries(filtered);

      // Display a message about the search results
      if (filtered.length > 0) {
        // Sort entries by date to get the most recent one first
        const sortedEntries = [...filtered].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Let the user know we found entries, but we'll only use the latest one for output
        toast({ 
          title: "Search Complete", 
          description: `Found ${filtered.length} entries between the selected dates. The latest update will be used for the PDF.` 
        });
      } else {
        toast({ 
          title: "No Results", 
          description: "No entries found for this goal in the selected date range." 
        });
      }
    } catch (error) {
      console.error('Error searching entries:', error);
      setFilteredEntries([]);
      toast({
        title: "Error",
        description: "Could not perform the search. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (startDate) {
      localStorage.setItem(`filter_start_${goal.id}`, startDate.toISOString());
    }
    if (endDate) {
      localStorage.setItem(`filter_end_${goal.id}`, endDate.toISOString());
    }
  }, [startDate, endDate, goal.id]);

  return (
    <div className={`${level > 0 ? 'ml-4' : ''} w-full`}>
      <Card className={`bg-card card-hover glow-effect ${level === 0 ? 'min-h-[280px]' : 'min-h-[180px]'} flex flex-col w-full relative overflow-hidden`}>
        {/* Decorative card accent border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30"></div>

        <CardHeader className="py-3 px-4 flex-shrink-0 border-b">
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center w-full relative">
              <div
                className="flex items-center gap-2 cursor-pointer group max-w-[75%]"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {hasSubGoals ? (
                  <div className="flex items-center transition-transform duration-300 ease-in-out">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    )}
                    {isExpanded ? (
                      <FolderOpen className="h-5 w-5 text-yellow-500 ml-1 transition-all group-hover:text-yellow-600 group-hover:scale-110" />
                    ) : (
                      <Folder className="h-5 w-5 text-yellow-500 ml-1 transition-all group-hover:text-yellow-600 group-hover:scale-110" />
                    )}
                  </div>
                ) : (
                  <div className="w-9" /> // Spacer for alignment
                )}
                <div className="max-w-full overflow-hidden">
                  <CardTitle className={`text-base font-medium truncate transition-colors duration-300 group-hover:text-primary ${hasSubGoals ? 'text-primary' : ''} card-title`}>
                    {goal.title}
                  </CardTitle>
                  {goal.description && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPreviewClick) {
                          onPreviewClick();
                        } else {
                          setShowPreview(true);
                        }
                      }}
                      className="text-sm text-muted-foreground mt-1 flex items-center hover:text-primary transition-colors duration-300 group-hover:text-primary/80 card-content max-w-full"
                    >
                      <FileText className="h-4 w-4 mr-1 transition-transform group-hover:scale-110 flex-shrink-0" />
                      <span className="line-clamp-1 truncate">{goal.description.slice(0, 50)}{goal.description.length > 50 ? '...' : ''}</span>
                    </button>
                  )}
                </div>
                {hasSubGoals && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2 transition-all group-hover:bg-primary/20 flex-shrink-0">
                    {subGoals.length}
                  </span>
                )}
              </div>

              <div className="flex gap-1 shrink-0 items-center ml-auto">
                <Link href={`/goal/${goal.id}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Track Work Session"
                    className="h-8 w-8 rounded-full icon-pulse btn-hover-effect"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Timer className="h-4 w-4 text-green-500" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                    setShowAddSub(true);
                  }}
                  title="Add Sub-Goal"
                  className="h-8 w-8 rounded-full icon-pulse btn-hover-effect"
                >
                  <Plus className="h-4 w-4 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  title="Edit"
                  className="h-8 w-8 rounded-full icon-pulse btn-hover-effect"
                >
                  <EditIcon className="h-4 w-4 text-amber-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this goal?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  title="Delete"
                  className="h-8 w-8 rounded-full icon-pulse btn-hover-effect"
                >
                  <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-2 overflow-y-auto flex-grow border-t mt-2 card-content">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative">
              <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Start Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0"
                  side="bottom"
                  align="start"
                  collisionPadding={16}
                  avoidCollisions={true}
                  style={{
                    maxHeight: '70vh',
                    overflowY: 'auto'
                  }}
                >
                  <Calendar
                    value={startDate}
                    onChange={(date) => {
                      setStartDate(date as Date);
                      setShowStartCalendar(false);
                    }}
                    className={`border-0 ${theme === 'dark' ? 'dark' : ''}`}
                    minDetail="month"
                    view="month"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="relative">
              <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'End Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0" 
                  align="center"
                  side="bottom"
                  sideOffset={5}
                  alignOffset={0}
                  avoidCollisions={true}
                >
                  <Calendar
                    value={endDate}
                    onChange={(date) => {
                      setEndDate(date as Date);
                      setShowEndCalendar(false);
                    }}
                    className={`border-0 ${theme === 'dark' ? 'dark' : ''}`}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              variant="default"
              onClick={handleSearch}
              disabled={!startDate || !endDate}
              className="btn-hover-effect relative overflow-hidden"
            >
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                // Show a loading toast first
                toast({
                  title: "Preparing PDF",
                  description: "Please wait while we prepare your PDF...",
                });
                
                try {
                  // Import jsPDF dynamically
                  const jsPDF = (await import('jspdf')).default;
                  const doc = new jsPDF();
                  
                  // Set document properties with better metadata
                  doc.setProperties({
                    title: `${goal.title} - Journal Entries with Interactive Media`,
                    subject: "Goal journal entries with clickable media elements",
                    creator: "Goal Tracker Application",
                  });
                  
                  // Add title
                  doc.setFontSize(16);
                  doc.setFont('helvetica', 'bold');
                  doc.text(goal.title, 20, 20);
                  
                  // Add date range if selected
                  let dateRangePart = "";
                  if (startDate && endDate) {
                    const startFormatted = format(startDate, 'MMM d, yyyy');
                    const endFormatted = format(endDate, 'MMM d, yyyy');
                    dateRangePart = ` (${startFormatted} - ${endFormatted})`;
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'italic');
                    doc.text(`Date Range: ${startFormatted} to ${endFormatted}`, 20, 30);
                  }
                  
                  // Setup for content
                  doc.setFontSize(12);
                  doc.setFont('helvetica', 'normal');
                  let yPosition = 40;
                  const margin = 20;
                  const pageHeight = doc.internal.pageSize.height;
                  const pageWidth = doc.internal.pageSize.width;
                  
                  // Helper function for adding clickable elements (based on your example)
                  const addClickableElement = (
                    doc: any,
                    url: string,
                    x: number,
                    y: number,
                    width: number,
                    height: number,
                    title?: string
                  ) => {
                    // Add clickable link area
                    doc.link(x, y, width, height, { url });

                    // Optional: Add underlined text label
                    if (title) {
                      doc.setTextColor(0, 0, 255); // Blue text
                      doc.setFontSize(10);
                      doc.text(title, x, y + height + 5);
                      // Add underline
                      doc.setLineWidth(0.1);
                      doc.line(x, y + height + 6, x + doc.getTextWidth(title), y + height + 6);
                      doc.setTextColor(0, 0, 0); // Reset color
                    }
                  };
                  
                  // Helper function to process content (based on your example)
                  const processContent = async (html: string, doc: any, startY: number) => {
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = DOMPurify.sanitize(html);
                    
                    let yPos = startY;
                    const margin = 20;
                    
                    // Extract text content first (excluding media elements)
                    let textContent = '';
                    Array.from(tempDiv.childNodes).forEach(node => {
                      if (node.nodeType === Node.TEXT_NODE) {
                        textContent += node.textContent;
                      } else if (node instanceof HTMLElement) {
                        // Skip media elements when collecting text
                        if (!node.hasAttribute('data-preview') && 
                            !node.hasAttribute('data-type') && 
                            node.tagName !== 'IMG') {
                          textContent += node.textContent;
                        }
                      }
                    });
                    
                    // Add text content
                    if (textContent.trim()) {
                      doc.setFontSize(11);
                      doc.setFont('helvetica', 'normal');
                      const lines = doc.splitTextToSize(textContent.trim(), pageWidth - 40);
                      
                      for (const line of lines) {
                        if (line.trim() === '') continue;
                        
                        if (yPos > pageHeight - 20) {
                          doc.addPage();
                          yPos = 20;
                        }
                        
                        doc.text(line, margin, yPos);
                        yPos += 7;
                      }
                      
                      yPos += 10; // Extra space after text
                    }
                    
                    // Now process media elements
                    const mediaElements = [
                      ...Array.from(tempDiv.querySelectorAll('img, [data-type="image"]')),
                      ...Array.from(tempDiv.querySelectorAll('[data-type="document"]'))
                    ];
                    
                    if (mediaElements.length > 0) {
                      // Add a section header for media if we have any
                      if (yPos > pageHeight - 40) {
                        doc.addPage();
                        yPos = 20;
                      }
                      
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.text("Media Elements:", margin, yPos);
                      yPos += 10;
                      
                      // Process each media element
                      for (const element of mediaElements) {
                        if (yPos > pageHeight - 60) {
                          doc.addPage();
                          yPos = 20;
                        }
                        
                        // Determine if this is an image
                        const isImage = element.tagName === 'IMG' || 
                                      element.getAttribute('data-type') === 'image';
                                      
                        const url = element.getAttribute('src') || 
                                  element.getAttribute('data-url') || 
                                  element.getAttribute('href');
                                  
                        const title = element.getAttribute('data-title') || 
                                    element.getAttribute('alt') || 
                                    (url ? url.split('/').pop() || 'Media' : 'Media');
                        
                        // Make URL absolute for PDF compatibility
                        let absoluteUrl = url || '';
                        if (url && !url.startsWith('http') && !url.startsWith('data:')) {
                          absoluteUrl = `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
                        }
                        
                        try {
                          if (isImage && url) {
                            // Generate thumbnail for image (async)
                            const thumbnail = await createThumbnail(url, 150, 120);
                            
                            // Add image to PDF with larger dimensions for better visibility
                            doc.addImage(thumbnail, 'JPEG', margin, yPos, 80, 60);
                            
                            // Make the entire image clickable
                            addClickableElement(doc, absoluteUrl, margin, yPos, 80, 60);
                            
                            // Add caption with title
                            doc.setFontSize(10);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(0, 0, 255); // Blue for clickable text
                            doc.text(title, margin, yPos + 70);
                            
                            // Make caption clickable
                            doc.link(margin, yPos + 65, doc.getTextWidth(title), 10, { url: absoluteUrl });
                            
                            // Add "Click to view" instruction
                            doc.setFontSize(8);
                            doc.setFont('helvetica', 'italic');
                            doc.text("(Click image or text to view in browser)", margin, yPos + 78);
                            
                            // Reset text color
                            doc.setTextColor(0, 0, 0);
                            
                            yPos += 85; // Space for next element
                          } 
                          else if (url) {
                            // For documents or other non-image media
                            try {
                              // Add document icon with better quality
                              doc.addImage(DOC_ICON, 'PNG', margin, yPos, 20, 20);
                              
                              // Make icon clickable with more padding for usability
                              doc.link(margin - 2, yPos - 2, 24, 24, { url: absoluteUrl });
                              
                              // Add clickable title with better formatting
                              doc.setFontSize(11);
                              doc.setFont('helvetica', 'bold');
                              doc.setTextColor(0, 0, 255);
                              
                              // Use textWithLink for better clickability
                              const titleX = margin + 25;
                              const titleY = yPos + 10;
                              
                              // Add the title text
                              doc.text(title, titleX, titleY);
                              
                              // Get title width for the clickable area
                              const titleWidth = doc.getTextWidth(title);
                              
                              // Add clickable link over the title text (with padding)
                              doc.link(titleX - 2, titleY - 8, titleWidth + 4, 12, { url: absoluteUrl });
                              
                              // Add underline to indicate clickability
                              doc.setLineWidth(0.1);
                              doc.line(titleX, titleY + 1, titleX + titleWidth, titleY + 1);
                              
                              // Add "Click to open" instruction
                              doc.setFontSize(8);
                              doc.setFont('helvetica', 'italic');
                              doc.setTextColor(0, 0, 128); // Dark blue
                              doc.text("Click to open document", margin + 25, yPos + 18);
                              
                              // Reset text color
                              doc.setTextColor(0, 0, 0);
                              
                              yPos += 30; // Space for next element
                            } catch (err) {
                              console.error("Document processing error:", err);
                              // Fallback to simple text with URL
                              doc.setFontSize(10);
                              doc.setTextColor(0, 0, 255);
                              doc.text(`${title} (document)`, margin, yPos);
                              doc.link(margin, yPos - 5, doc.getTextWidth(`${title} (document)`), 10, { url: absoluteUrl });
                              doc.setTextColor(0);
                              yPos += 15;
                            }
                          }
                        } catch (error) {
                          console.error('Error processing media element:', error);
                          
                          // Still try to make the element clickable even if rendering fails
                          if (url) {
                            try {
                              // Create a more graceful fallback that's still clickable
                              doc.setFontSize(10);
                              doc.setTextColor(0, 0, 255); // Blue for clickable
                              
                              // Add a simple clickable text with appropriate icon mention
                              const fallbackText = isImage 
                                ? `[Image: ${title}]` 
                                : `[Document: ${title}]`;
                              
                              doc.text(fallbackText, margin, yPos);
                              
                              // Make text clickable
                              doc.link(margin, yPos - 5, doc.getTextWidth(fallbackText), 10, { url: absoluteUrl });
                              
                              // Add view instruction
                              doc.setFontSize(8);
                              doc.setFont('helvetica', 'italic');
                              doc.text("(Click to open)", margin, yPos + 8);
                              
                              // Reset styling
                              doc.setTextColor(0, 0, 0);
                              yPos += 15;
                            } catch (innerError) {
                              // Last resort fallback
                              doc.setFontSize(9);
                              doc.setTextColor(100, 100, 100); // Less aggressive than red
                              doc.text(`${isImage ? 'Image' : 'Document'}: ${title}`, margin, yPos);
                              doc.setTextColor(0, 0, 0);
                              yPos += 15;
                            }
                          } else {
                            // If no URL is available, just show error text
                            doc.setFontSize(9);
                            doc.setTextColor(100, 100, 100);
                            doc.text(`Media element: ${title}`, margin, yPos);
                            doc.setTextColor(0, 0, 0);
                            yPos += 15;
                          }
                        }
                      }
                    }
                    
                    return yPos; // Return the new Y position
                  };
                  
                  // Filter entries
                  if (filteredEntries.length === 0) {
                    doc.text("No entries found for the selected date range.", margin, yPosition);
                  } else {
                    // Add content from filtered entries
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text("Journal Entries:", margin, yPosition);
                    yPosition += 10;
                    
                    // Sort entries by date (newest first)
                    const sortedEntries = [...filteredEntries].sort((a, b) => 
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    
                    // Process each entry using our enhanced content processor
                    for (const entry of sortedEntries) {
                      // Add date header
                      const entryDate = format(new Date(entry.date), 'MMMM d, yyyy');
                      doc.setFontSize(13);
                      doc.setFont('helvetica', 'bold');
                      
                      // Check if we need a new page
                      if (yPosition > pageHeight - 30) {
                        doc.addPage();
                        yPosition = 20;
                      }
                      
                      doc.text(entryDate, margin, yPosition);
                      yPosition += 10;
                      
                      // Process the HTML content with our enhanced function
                      yPosition = await processContent(entry.text, doc, yPosition);
                      
                      // Add spacing and separator between entries
                      if (yPosition > pageHeight - 20) {
                        doc.addPage();
                        yPosition = 20;
                      } else {
                        // Add separator line
                        doc.setDrawColor(200, 200, 200);
                        doc.line(margin, yPosition, pageWidth - margin, yPosition);
                        yPosition += 15;
                      }
                    }
                  }
                  
                  // Add footer with instructions on clickable elements
                  const pageCount = doc.getNumberOfPages();
                  for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'italic');
                    doc.setTextColor(100, 100, 100);
                    
                    // Add page numbers
                    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 40, pageHeight - 10);
                    
                    // Add clickable elements note
                    doc.text("This PDF contains clickable media elements - Best viewed in Adobe Reader or Chrome", 20, pageHeight - 10);
                  }
                  
                  // Create a safe filename
                  const safeFilename = goal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                  
                  // Save using direct method which is more reliable
                  doc.save(`${safeFilename}${dateRangePart}-entries.pdf`);
                  
                  toast({
                    title: "Success",
                    description: "PDF downloaded successfully with clickable and previewable media elements.",
                  });
                } catch (error) {
                  console.error('PDF generation error:', error);
                  toast({
                    title: "Error",
                    description: "Failed to generate PDF. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
              disabled={filteredEntries.length === 0}
              className="flex items-center gap-2 btn-hover-effect border-primary/30 hover:bg-primary/5"
            >
              <Download className="h-4 w-4 text-primary icon-pulse" />
              Download PDF
            </Button>
          </div>

          {filteredEntries.length > 0 && (
            <div className="mt-4 max-h-60 overflow-y-auto border rounded-lg p-4">
              {filteredEntries.map((entry, index) => (
                <div 
                  className={`mb-2 pb-2 border-b last:border-b-0 ${
                    entry.date === searchDate ? 'border-2 border-primary rounded p-2' : ''
                  }`}
                >
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(entry.date), 'MMM d, yyyy')}
                  </div>
                  <div 
                    className="mt-1 text-sm" 
                    dangerouslySetInnerHTML={{ 
                      __html: entry.text.replace(
                        /<span data-preview[^>]*>(.*?)<\/span>/g,
                        (match) => {
                          // Make wrapper clickable
                          return match.replace(
                            'class="group cursor-pointer',
                            'class="group cursor-pointer inline-block'
                          );
                        }
                      ) 
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
              ))}
            </div>
          )}

          {isExpanded && hasSubGoals && (
            <div className="mt-4 pl-4 space-y-2 border-l-2 border-primary/30">
              <h4 className="text-sm font-medium text-primary border-b pb-1 flex items-center">
                <FolderOpen className="h-4 w-4 mr-1" /> Sub-Goals
              </h4>
              {subGoals.map((sg) => (
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editedGoal.title}
                onChange={(e) =>
                  setEditedGoal({ ...editedGoal, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editedGoal.description || ""}
                onChange={(e) =>
                  setEditedGoal({
                    ...editedGoal,
                    description: e.target.value,
                  })
                }
                rows={5}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Sub-Goal Dialog */}
      <Dialog open={showAddSub} onOpenChange={setShowAddSub}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sub-Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Enter sub-goal title"
                onChange={(e) =>
                  setEditedGoal({ ...editedGoal, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                placeholder="Enter sub-goal description"
                onChange={(e) =>
                  setEditedGoal({
                    ...editedGoal,
                    description: e.target.value,
                  })
                }
                rows={5}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowAddSub(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={() => addSubMutation.mutate(editedGoal)}
              disabled={addSubMutation.isPending || !editedGoal.title?.trim()}
            >
              {addSubMutation.isPending ? "Adding..." : "Add Sub-Goal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{goal.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto">
            <div className="prose dark:prose-invert max-w-none">
              <h3>Description</h3>
              <div 
                className="text-base whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: goal.description?.replace(
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
  );
}