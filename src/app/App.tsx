import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import { useThemeStore } from "@/shared/store/useThemeStore";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { usePropertyStore } from "@/shared/store/usePropertyStore";
import Home from "./pages/Home";

import AllComments from "../features/clientPortal/comments/pages/AllCommentsPage";
import AllFAQs from "../features/clientPortal/faq/pages/AllFAQPage";
import About from "./pages/About";
import Properties from "../features/clientPortal/properties/pages/PropertiesPage";
import PropertyDetails from "../features/clientPortal/properties/pages/PropertyDetailsPage";
import Service from "./pages/Service";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { BlogPage, BlogPostDetailsPage } from "../features/clientPortal/blog";
import Login from "../features/clientPortal/auth/pages/Login";
import VerifyEmail from "../features/clientPortal/auth/pages/VerifyEmail";
import ForgotPassword from "../features/clientPortal/auth/pages/ForgotPassword";
import ResetPassword from "../features/clientPortal/auth/pages/ResetPassword";
import GoogleCallback from "../features/clientPortal/auth/pages/GoogleCallback";
import Profile from "../features/clientPortal/auth/pages/Profile";
import AccountPage from "../features/clientPortal/auth/pages/AccountPage";
import PropertyFeatureIconsPage from "../features/clientPortal/properties/pages/PropertyFeatureIconsPage";
import ListPropertyPage from "../features/clientPortal/properties/pages/ListPropertyPage";
import RequestPropertyPage from "../features/clientPortal/properties/pages/RequestPropertyPage";
import CoRentPage from "../features/clientPortal/properties/pages/CoRentPage";
import AgentLoginPage from "../features/agentPortal/auth/pages/AgentLoginPage";
import AgentForgotPasswordPage from "../features/agentPortal/auth/pages/AgentForgotPasswordPage";
import AgentDashboardPage from "../features/agentPortal/dashboard/pages/AgentDashboardPage";
import AgentListingsPage from "../features/agentPortal/listings/pages/AgentListingsPage";
import AgentLeadsPage from "../features/agentPortal/leads/pages/AgentLeadsPage";
import AgentVisitsPage from "../features/agentPortal/visits/pages/AgentVisitsPage";
import AgentEarningsPage from "../features/agentPortal/earnings/pages/AgentEarningsPage";
import AgentProfilePage from "../features/agentPortal/profile/pages/AgentProfilePage";



function App() {
  const theme = useThemeStore((s) => s.theme);
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated && token) {
      void usePropertyStore.getState().fetchWishlist();
    }
  }, [isAuthenticated, token]);
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Toaster 
          theme={theme as "light" | "dark"} 
          closeButton 
          position="top-right"
          toastOptions={{
            className: "font-sans",
            style: {
              borderRadius: "1rem",
            },
            classNames: {
              toast: "rounded-2xl bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white border-gray-200 dark:border-white/10 shadow-lg border",
              description: "text-gray-500 dark:text-gray-400",
              actionButton: "rounded-full bg-[#703BF7] px-4 text-white hover:bg-[#5c2fe0] transition-colors",
              cancelButton: "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors",
              success: "text-[#0F766E] dark:text-[#5EEAD4]",
              error: "text-[#B91C1C] dark:text-[#FCA5A5]",
              warning: "text-[#D97706] dark:text-[#FBBF24]",
              info: "text-[#703BF7] dark:text-[#9677df]",
            }
          }}
        />
        <Routes>
          <Route index path="/" element={<Home />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/google" element={<GoogleCallback />} />
          <Route path="/auth/profile" element={<AccountPage />} />
          <Route path="/auth/profile/settings" element={<Profile />} />
          <Route path="/agent/login" element={<AgentLoginPage />} />
          <Route path="/agent/forgot-password" element={<AgentForgotPasswordPage />} />
          <Route path="/agent/listings/*" element={<AgentListingsPage />} />
          <Route path="/agent/leads/*" element={<AgentLeadsPage />} />
          <Route path="/agent/visits/*" element={<AgentVisitsPage />} />
          <Route path="/agent/earnings/*" element={<AgentEarningsPage />} />
          <Route path="/agent/profile" element={<AgentProfilePage />} />
          <Route path="/agent/*" element={<AgentDashboardPage />} />
          <Route path="/AllComments" element={<AllComments />} />
          <Route path="/AllFAQs" element={<AllFAQs />} />
          <Route path="/About" element={<About />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:slug" element={<PropertyDetails />} />
          <Route path="/request-property" element={<RequestPropertyPage />} />
          <Route path="/co-rent" element={<CoRentPage />} />
          <Route path="/list-property" element={<ListPropertyPage />} />
          <Route path="/property-feature-icons" element={<PropertyFeatureIconsPage />} />
          <Route path="/Service" element={<Service />} />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/Studentarea" element={<Navigate to="/properties" replace />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostDetailsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  )
}

export default App