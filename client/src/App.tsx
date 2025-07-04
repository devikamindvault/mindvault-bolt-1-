
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { ProtectedRoute } from "@/components/protected-route";
import Home from "./pages/home";
import GoalsPage from "./pages/goals";
import AnalysisPage from "./pages/analysis";
import GoalDetailPage from "./pages/goal-detail";
import GoalRecordingsPage from "./pages/goal-recordings";
import NotFound from "./pages/not-found";
import { queryClient } from "./lib/queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
        <main>
          <Switch>
            {/* Main application pages with their original paths */}
            <ProtectedRoute path="/" component={Home} />
            <ProtectedRoute path="/goals" component={GoalsPage} />
            <ProtectedRoute path="/analysis" component={AnalysisPage} />
            <ProtectedRoute path="/goal-detail/:id" component={GoalDetailPage} />
            <ProtectedRoute path="/goal-recordings/:id" component={GoalRecordingsPage} />
            
            <Route path="/login">
              {() => {
                return null;
              }}
            </Route>
            <Route component={NotFound} />
          </Switch>
        </main>
        <Toaster />
    </QueryClientProvider>
  );
}
