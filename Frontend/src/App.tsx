import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../src/components/contexts/AuthContext";
import { ChallengeProvider } from "../src/components/contexts/ChallengeContext";
import { ThemeProvider } from "../src/components/contexts/ThemeContext";
import { RequestsProvider } from "../src/components/contexts/RequestsContext";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Play from "./pages/Play";
import Requests from "./pages/Requests";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ChallengeProvider>
              <RequestsProvider>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route path="/play" element={<Play />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:username" element={<Profile />} />
                  </Route>
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </RequestsProvider>
            </ChallengeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
