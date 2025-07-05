import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import Home from "./pages/home";
import GoalsPage from "./pages/goals";
import NotFound from "./pages/not-found";
import { queryClient } from "./lib/queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/goals" component={GoalsPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Toaster />
    </QueryClientProvider>
  );
}