
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Goal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

interface GoalsDropdownProps {
  onSelectGoal: (goal: Goal) => void;
  goals?: Goal[];
  onDescriptionClick?: (content: string) => void;
  onSubGoalClick?: (goal: Goal) => void;
}

export function GoalsDropdown({ 
  onSelectGoal, 
  goals,
  onDescriptionClick,
  onSubGoalClick
}: GoalsDropdownProps) {
  const { theme } = useTheme();
  const [hoveredGoal, setHoveredGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: fetchedGoals } = useQuery<Goal[]>({
    enabled: !goals,
  });
  
  const allGoals = goals || fetchedGoals || [];
  const mainGoals = allGoals.filter((goal) => !goal.parentId);

  // Handle window resize
  useEffect(() => {
    // Nothing to do if side panel is not shown
    if (!showSidePanel) return;

    const handleResize = () => {
      // Reset position on resize if needed
      setShowSidePanel(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showSidePanel]);

  const handleMouseEnter = (goal: Goal, event: React.MouseEvent) => {
    setHoveredGoal(goal);
    setShowSidePanel(true);
    const currentTargetElement = event.currentTarget as HTMLDivElement;
    const rect = currentTargetElement.getBoundingClientRect();
    const parentRect = dropdownRef.current?.getBoundingClientRect();

    if (parentRect) {
      setPanelPosition({
        top: rect.top - parentRect.top,
        left: rect.right - parentRect.left + 8
      });
    }
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      if (!document.querySelector('.side-panel:hover')) {
        setShowSidePanel(false);
      }
    }, 100);
  };
  
  const handleSubGoalClick = (subGoal: Goal) => {
    if (onSubGoalClick) {
      onSubGoalClick(subGoal);
    }
  };
  
  const handleDescriptionClick = () => {
    if (hoveredGoal?.description && onDescriptionClick) {
      onDescriptionClick(hoveredGoal.description);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{selectedGoal ? selectedGoal.title : 'Select Goal'}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {mainGoals?.map((goal) => (
            <DropdownMenuItem
              onClick={() => {
                setSelectedGoal(goal);
                onSelectGoal(goal);
              }}
              onMouseEnter={(e) => handleMouseEnter(goal, e)}
              onMouseLeave={handleMouseLeave}
            >
              {goal.title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {showSidePanel && hoveredGoal && (
        <div 
          className={cn(
            "side-panel absolute z-50 w-[300px] rounded-md border shadow-lg transition-opacity duration-200",
            theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"
          )}
          style={{ 
            top: panelPosition.top,
            left: panelPosition.left,
            opacity: showSidePanel ? 1 : 0
          }}
          onMouseEnter={() => setShowSidePanel(true)}
          onMouseLeave={() => setShowSidePanel(false)}
        >
          <div className="p-4">
            <h3 className="font-medium mb-2">{hoveredGoal.title}</h3>
            
            {hoveredGoal.description && (
              <div 
                className="text-sm mb-4 cursor-pointer hover:underline"
                onClick={handleDescriptionClick}
              >
                <p className="font-medium">Description:</p>
                <p className="text-muted-foreground line-clamp-2">{hoveredGoal.description}</p>
              </div>
            )}
            
            <div className="space-y-1 mt-4">
              <h4 className="text-sm font-medium">Sub Goals</h4>
              {allGoals.filter(goal => goal.parentId === hoveredGoal.id).map(subGoal => (
                <button
                  onClick={() => handleSubGoalClick(subGoal)}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                >
                  {subGoal.title}
                </button>
              ))}
              {allGoals.filter(goal => goal.parentId === hoveredGoal.id).length === 0 && (
                <p className="text-sm text-muted-foreground">No sub-goals available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
