import { BrowserRouter, Routes, Route } from "react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import { useThemeStore } from "../shared/store/useThemeStore";
import Home from "./pages/Home";

import AllComments from "../features/comments/pages/AllCommentsPage";
import AllFAQs from "../features/faq/pages/AllFAQPage";
import About from "./pages/About";
import Properties from "../features/properties/pages/PropertiesPage";
import PropertyDetails from "../features/properties/pages/PropertyDetailsPage";
import Service from "./pages/Service";
import Contact from "./pages/Contact";
import StudentHousing from "./pages/StudentArea";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { BlogPage, BlogPostDetailsPage } from "../features/blog";



function App() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
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
              borderRadius: '0.625rem',
            },
            classNames: {
              toast: "bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white border-purple-100 dark:border-gray-800 shadow-xl border",
              description: "text-gray-500 dark:text-gray-400",
              actionButton: "bg-[#703BF7] text-white hover:bg-[#9677df] transition-colors",
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
          <Route path="/AllComments" element={<AllComments />} />
          <Route path="/AllFAQs" element={<AllFAQs />} />
          <Route path="/About" element={<About />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:slug" element={<PropertyDetails />} />
          <Route path="/Service" element={<Service />} />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/Studentarea" element={<StudentHousing />} />
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