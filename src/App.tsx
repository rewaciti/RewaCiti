import { BrowserRouter, Routes, Route } from "react-router";
import { useEffect } from "react";
import { useThemeStore } from "./Store/useThemeStore";
import Home from "./Pages/Home";
import AllProperties from "./Pages/AllProperties";
import AllComments from "./Pages/AllComment";
import AllFAQs from "./Pages/AllFAQ";
import About from "./Pages/About";
import Properties from "./Pages/Properties";
import PropertyDetails from "./Pages/PropertyDetails.tsx";
import Service from "./Pages/Service";
import Contact from "./Pages/Contact";
import StudentHousing from "./Pages/Studentarea";
import NotFound from "./Pages/404Page";
import TermsPolicies from "./Pages/Terms&Policies";


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
        {/* <Route path="/login" element={<Login />} />
        <Route path="/Admindashboard" element={<Admindashboard />} />
        <Route path="/property-form" element={<PropertyForm />} /> */}
        <Route path="*" element={<NotFound />} />
        <Route path="/terms-policies" element={<TermsPolicies />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App