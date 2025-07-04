
import { Goal } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface GoalsSidePanelProps {
  mainGoal: Goal | null;
  selectedSubGoal: Goal | null;
  onSelectSubGoal: (goal: Goal) => void;
  goals?: Goal[];
}

export function GoalsSidePanel({
  mainGoal,
  selectedSubGoal,
  onSelectSubGoal,
  goals,
}: GoalsSidePanelProps) {
  const { data: fetchedGoals } = useQuery<Goal[]>({
    enabled: !goals,
  });
  
  const allGoals = goals || fetchedGoals || [];

  const subGoals = allGoals.filter((goal) => goal.parentId === mainGoal?.id);

  if (!mainGoal) return null;

  return (
    <div className="w-64 border-l h-full p-4 bg-background">
      <h3 className="font-semibold mb-2">{mainGoal.title}</h3>
      {mainGoal.description && (
        <p className="text-sm text-muted-foreground mb-4">
          {mainGoal.description}
        </p>
      )}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Sub Goals</h4>
        {subGoals.map((goal) => (
          <button
            onClick={() => onSelectSubGoal(goal)}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors",
              selectedSubGoal?.id === goal.id && "bg-accent text-accent-foreground"
            )}
          >
            {goal.title}
          </button>
        ))}
      </div>
    </div>
  );
}
