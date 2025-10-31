import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UsageProvider } from "@/contexts/UsageContext";
import Index from "./pages/Index";
import BuildIt from "./pages/BuildIt";
import About from "./pages/About";
import TeachIt from "./pages/TeachIt";
import LaunchIt from "./pages/LaunchIt";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import AssessIt from "./pages/AssessIt";
import PrepIt from "./pages/PrepIt";
import Courses from "./pages/Courses";
import PromptIt from "./pages/PromptIt";
import CodeIt from "./pages/CodeIt";
import DeployIt from "./pages/DeployIt";
import CreateIt from "./pages/CreateIt";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import FundIt from "./pages/FundIt";
import FreelancerMarketplace from "./pages/FreelancerMarketplace";
import FreelancerOnboarding from "./pages/FreelancerOnboarding";
import ClientOnboarding from "./pages/ClientOnboarding";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import Admin from "./pages/Admin";
import EarnIt from "./pages/EarnIt";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import ScheduleIt from "./pages/ScheduleIt";
import HostIt from "./pages/HostIt";
import SpeakIt from "./pages/SpeakIt";
import BeforeYouStart from "./pages/BeforeYouStart";
import AuthCallback from "./pages/AuthCallback";

import { HelmetProvider } from 'react-helmet-async';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
      <AuthProvider>
        <UsageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/teachit" element={<TeachIt />} />
          <Route path="/launchit" element={<LaunchIt />} />
          <Route path="/scheduleit" element={<ScheduleIt />} />
          <Route path="/hostit" element={<HostIt />} />
          <Route path="/speakit" element={<SpeakIt />} />
          <Route path="/before-you-start" element={<BeforeYouStart />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/promptit" element={<PromptIt />} />
            <Route path="/codeit" element={<CodeIt />} />
            <Route path="/deployit" element={<DeployIt />} />
            <Route path="/createit" element={<CreateIt />} />
            <Route path="/learnit" element={<Courses />} /> {/* Redirect old route */}
            <Route path="/assessit" element={<AssessIt />} />
            <Route path="/prepit" element={<PrepIt />} />
            <Route path="/buildit" element={<BuildIt />} />
            <Route path="/fundit" element={<FundIt />} />
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
            <Route path="/earnit" element={<EarnIt />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </UsageProvider>
      </AuthProvider>
    </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
