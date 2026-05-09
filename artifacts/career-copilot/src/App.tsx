import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/context/AuthContext";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Resume from "@/pages/resume";
import Applications from "@/pages/applications";
import ApplicationDetails from "@/pages/application-details";
import AiAssistant from "@/pages/ai-assistant";
import Settings from "@/pages/settings";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Redirect to="/dashboard" />;
  return <Landing />;
}

function ProtectedRoute({ component: Component, ...props }: { component: React.ComponentType<Record<string, unknown>> } & Record<string, unknown>) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect to="/" />;
  return <AppLayout><Component {...props} /></AppLayout>;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/resume"><ProtectedRoute component={Resume} /></Route>
      <Route path="/applications"><ProtectedRoute component={Applications} /></Route>
      <Route path="/applications/:id">
        {(params: { id: string }) => (
          <ProtectedRoute component={ApplicationDetails as React.ComponentType<Record<string, unknown>>} id={params.id} />
        )}
      </Route>
      <Route path="/ai"><ProtectedRoute component={AiAssistant} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="career-copilot-theme">
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={basePath}>
              <AppRoutes />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
