import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UsageProvider } from "@/contexts/UsageContext";
import Index from "./pages/Index";
import Reskill from "./pages/Reskill";
import HireYourself from "./pages/HireYourself";
import About from "./pages/About";
import TeachIt from "./pages/TeachIt";
import LaunchIt from "./pages/LaunchIt";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import Assessments from "./pages/Assessments";
import JobPrep from "./pages/JobPrep";
import LearnASkill from "./pages/LearnASkill";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import GrantWriting from "./pages/GrantWriting";
import FreelancerMarketplace from "./pages/FreelancerMarketplace";
import FreelancerOnboarding from "./pages/FreelancerOnboarding";
import ClientOnboarding from "./pages/ClientOnboarding";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import Admin from "./pages/Admin";
import SideIncomeBlueprint from "./pages/SideIncomeBlueprint";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <UsageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/teachit" element={<TeachIt />} />
            <Route path="/launchit" element={<LaunchIt />} />
            <Route path="/reskill" element={<Reskill />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/jobprep" element={<JobPrep />} />
            <Route path="/learn-a-skill" element={<LearnASkill />} />
            <Route path="/hireyourself" element={<HireYourself />} />
            <Route path="/grantwriting" element={<GrantWriting />} />
            <Route path="/freelancer-marketplace" element={<FreelancerMarketplace />} />
            <Route path="/freelancer-onboarding" element={<FreelancerOnboarding />} />
            <Route path="/client-onboarding" element={<ClientOnboarding />} />
            <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/side-income-blueprint" element={<SideIncomeBlueprint />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </UsageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
