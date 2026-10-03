import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Consultants from "@/pages/consultants"; 
import ConsultantProfile from "@/pages/consultant-profile";
import Courses from "@/pages/courses";
import Profile from "@/pages/profile";
import AuthPage from "@/pages/auth-page";
import CheckoutPage from "@/pages/checkout-page";
import BookingPage from "@/pages/booking-page";
import ProviderManagement from "@/pages/provider-management";
import Dashboard from "@/pages/dashboard";
import ConsultantDashboard from "@/pages/consultant-dashboard";
import Navigation from "@/components/navigation";
import { AuthProvider } from "@/hooks/use-auth";
import { TranslationProvider } from "@/hooks/use-translations";
import { CartProvider } from "@/hooks/use-cart";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/consultants" component={Consultants} />
          <Route path="/consultants/:id" component={ConsultantProfile} />
          <Route path="/courses" component={Courses} />
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/consultant-dashboard" component={ConsultantDashboard} />
          <ProtectedRoute path="/profile" component={Profile} />
          <ProtectedRoute path="/checkout" component={CheckoutPage} />
          <ProtectedRoute path="/booking" component={BookingPage} />
          <ProtectedRoute path="/provider-management" component={ProviderManagement} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <CartProvider>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </CartProvider>
      </TranslationProvider>
    </QueryClientProvider>
  );
}

export default App;