import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Cars from "@/pages/Cars";
import CarDetail from "@/pages/CarDetail";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import AddCar from "@/pages/AddCar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Switch>
          {isLoading || !isAuthenticated ? (
            <>
              <Route path="/" component={Landing} />
              <Route path="/cars" component={Cars} />
              <Route path="/cars/:id" component={CarDetail} />
              <Route path="/about" component={About} />
              <Route path="/contact" component={Contact} />
            </>
          ) : (
            <>
              <Route path="/" component={Home} />
              <Route path="/cars" component={Cars} />
              <Route path="/cars/:id" component={CarDetail} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/profile" component={Profile} />
              <Route path="/owner/cars/new" component={AddCar} />
              <Route path="/about" component={About} />
              <Route path="/contact" component={Contact} />
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
