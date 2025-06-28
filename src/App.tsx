
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import GovernmentLoginPage from "./pages/GovernmentLoginPage";
import GovernmentDashboardPage from "./pages/GovernmentDashboardPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, 
      retry: 1,
    },
  },
});

const HospitalProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userType } = useAuth();
  
  if (!isAuthenticated || userType !== 'hospital') {
    return <Navigate to="/register" />;
  }
  
  return <>{children}</>;
};

const GovernmentProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userType } = useAuth();
  
  if (!isAuthenticated || userType !== 'government') {
    return <Navigate to="/gov-login" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <AuthProvider>
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/gov-login" element={<GovernmentLoginPage />} />
          <Route path="/dashboard" element={
            <HospitalProtectedRoute>
              <DashboardPage />
            </HospitalProtectedRoute>
          } />
          <Route path="/government-dashboard" element={
            <GovernmentProtectedRoute>
              <GovernmentDashboardPage />
            </GovernmentProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  </AuthProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
