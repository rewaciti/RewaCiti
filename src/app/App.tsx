import { BrowserRouter, Routes, Route } from "react-router";
import { useEffect } from "react";
import { useThemeStore } from "../shared/store/useThemeStore";
import Home from "./pages/Home";
import AllProperties from "../features/properties/pages/AllPropertiesPage";
import AllComments from "../features/comments/pages/AllCommentsPage";
import AllFAQs from "../features/faq/pages/AllFAQPage";
import About from "./pages/About";
import Properties from "../features/properties/pages/PropertiesPage";
import PropertyDetails from "../features/properties/pages/PropertyDetailsPage";
import Service from "./pages/Service";
import Contact from "./pages/Contact";
import StudentHousing from "./pages/StudentArea";
import NotFound from "./pages/NotFound";
import TermsPolicies from "./pages/Terms";


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
    <BrowserRouter>
      <Routes>
        <Route index path="/" element={<Home />} />
        <Route path="/AllProperties" element={<AllProperties />} />
        <Route path="/AllComments" element={<AllComments />} />
        <Route path="/AllFAQs" element={<AllFAQs />} />
        <Route path="/About" element={<About />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:name" element={<PropertyDetails />} />
        <Route path="/Service" element={<Service />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/Studentarea" element={<StudentHousing />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/terms-policies" element={<TermsPolicies />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App