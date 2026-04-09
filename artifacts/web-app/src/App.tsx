import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import TransactionsPage from "@/pages/transactions";
import ProductsPage from "@/pages/products";
import PayoutsPage from "@/pages/payouts";
import CheckoutPage from "@/pages/checkout";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

function Spinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, merchant } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(`${base}/login`);
    } else if (!isLoading && isAuthenticated && merchant && merchant.onboarding_status !== "approved" && merchant.status !== "active") {
      navigate(`${base}/onboarding`);
    }
  }, [isLoading, isAuthenticated, merchant]);

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}

function RootRedirect() {
  const { isAuthenticated, isLoading, merchant } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { navigate(`${base}/login`); return; }
    if (merchant?.status === "active" || merchant?.onboarding_status === "approved") {
      navigate(`${base}/dashboard`);
    } else {
      navigate(`${base}/onboarding`);
    }
  }, [isLoading, isAuthenticated, merchant]);

  return <Spinner />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/dashboard" component={() => <AuthGuard><DashboardPage /></AuthGuard>} />
      <Route path="/transactions" component={() => <AuthGuard><TransactionsPage /></AuthGuard>} />
      <Route path="/products" component={() => <AuthGuard><ProductsPage /></AuthGuard>} />
      <Route path="/payouts" component={() => <AuthGuard><PayoutsPage /></AuthGuard>} />
      <Route path="/checkout" component={() => <AuthGuard><CheckoutPage /></AuthGuard>} />
      <Route path="/settings" component={() => <AuthGuard><SettingsPage /></AuthGuard>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={base}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
