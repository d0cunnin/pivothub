import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import ContractIt from "./pages/ContractIt";
import DevelopIt from "./pages/DevelopIt";
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
import GardenIt from "./pages/GardenIt";
import SpeakIt from "./pages/SpeakIt";
import ActIt from "./pages/ActIt";
import StudyIt from "./pages/StudyIt";
import BeforeYouStart from "./pages/BeforeYouStart";
import AuthCallback from "./pages/AuthCallback";
import PasswordRecovery from "./pages/PasswordRecovery";

import { HelmetProvider } from 'react-helmet-async';
import AppErrorBoundary from "@/components/AppErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import CanonicalUrl from "@/components/CanonicalUrl";
import HomeScreenPrompt from "@/components/HomeScreenPrompt";
import ToolPageAppearance from "@/components/ToolPageAppearance";

const queryClient = new QueryClient();

const App = () => (
  <AppErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
      <AuthProvider>
        <UsageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <ScrollToTop />
          <CanonicalUrl />
          <HomeScreenPrompt />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<PasswordRecovery />} />
            <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
            <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/teachit" element={<ToolPageAppearance><TeachIt /></ToolPageAppearance>} />
          <Route path="/launchit" element={<ToolPageAppearance><LaunchIt /></ToolPageAppearance>} />
          <Route path="/scheduleit" element={<ToolPageAppearance><ScheduleIt /></ToolPageAppearance>} />
          <Route path="/hostit" element={<ToolPageAppearance><HostIt /></ToolPageAppearance>} />
          <Route path="/gardenit" element={<ToolPageAppearance><GardenIt /></ToolPageAppearance>} />
          <Route path="/speakit" element={<ToolPageAppearance><SpeakIt /></ToolPageAppearance>} />
            <Route path="/actit" element={<ToolPageAppearance><ActIt /></ToolPageAppearance>} />
            <Route path="/studyit" element={<ToolPageAppearance><StudyIt /></ToolPageAppearance>} />
            <Route path="/before-you-start" element={<BeforeYouStart />} />
            <Route path="/courses" element={<Navigate to="/" replace />} />
            <Route path="/promptit" element={<ToolPageAppearance><PromptIt /></ToolPageAppearance>} />
            <Route path="/codeit" element={<ToolPageAppearance><CodeIt /></ToolPageAppearance>} />
            <Route path="/deployit" element={<ToolPageAppearance><DeployIt /></ToolPageAppearance>} />
            <Route path="/createit" element={<ToolPageAppearance><CreateIt /></ToolPageAppearance>} />
            <Route path="/learnit" element={<Navigate to="/" replace />} />
            <Route path="/assessit" element={<ToolPageAppearance><AssessIt /></ToolPageAppearance>} />
            <Route path="/prepit" element={<ToolPageAppearance><PrepIt /></ToolPageAppearance>} />
            <Route path="/buildit" element={<ToolPageAppearance><BuildIt /></ToolPageAppearance>} />
            <Route path="/fundit" element={<ToolPageAppearance><FundIt /></ToolPageAppearance>} />
            <Route path="/contractit" element={<ToolPageAppearance><ContractIt /></ToolPageAppearance>} />
            <Route path="/developit" element={<ToolPageAppearance><DevelopIt /></ToolPageAppearance>} />
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
            <Route path="/earnit" element={<ToolPageAppearance><EarnIt /></ToolPageAppearance>} />
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
  </AppErrorBoundary>
);

export default App;
