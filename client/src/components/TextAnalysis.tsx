import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Goal } from "@shared/schema";

interface TextAnalysisProps {
  text: string;
}

export function TextAnalysis({ text }: TextAnalysisProps) {
  const { data: goals, isLoading: goalsLoading } = useQuery<Goal[]>({
  });

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    enabled: text.length > 0,
  });

  if (goalsLoading || analysisLoading) {
    return <Skeleton className="w-full h-48" />;
  }

  const matchingGoals = goals?.filter(goal => 
    )
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Grammar & Spelling</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis?.correctedText && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Suggested corrections:</p>
              <p>{analysis.correctedText}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matching Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {matchingGoals?.map(goal => (
                {goal.title}
              </Badge>
            ))}
            {matchingGoals?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No matching goals found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
