import Navbar from "../../../shared/components/Layout/Navbar";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { usePropertyStore } from "../store/usePropertyStore";
import { useAreaMapStore } from "../../map/store/useAreaMapStore";
import { FiArrowLeft, FiArrowRight, FiFilter } from "react-icons/fi";
import PropertyCard from "../components/PropertyCard";
import PropertyMap from "../components/PropertyMap";
import Footer from "../../../shared/components/Layout/Footer";
import useScrollToHash from "../../../shared/hooks/useScrollToHash";
import { Link, NavLink } from "react-router";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import CustomDropdown from "../components/CustomDropdown";
import PropertyFiltersModal from "../components/PropertyFiltersModal";
import { COMPANY_ID, useAuthStore } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { PropertyCardSkeleton } from "../../../shared/components/ui/Skeletons";
import { getCookie, setCookie } from "../../../shared/lib/utils";

// Height of Navbar (top-16 = 4rem) — used to offset the sticky map panel
const NAVBAR_HEIGHT_PX = 64;

function StudentAreaPage() {
  const { isAuthenticated, customer } = useAuthStore();
  useScrollToHash();
  const {
    properties,
    loading,
    ITEMS_PER_PAGE,
    fetchProperties,
    nextPage,
    prevPage,
    apiPage,
    totalProperties,
  } = usePropertyStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [selectedUniversity, setUniversity] = useState("");
  const { areaMaps, loading: areaLoading, fetchAreaMaps } = useAreaMapStore();
  const [category, setCategory] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [preferedLocation, setPreferedLocation] = useState("");
  const [preferedCategory, setPreferedCategory] = useState("");
  const [Budget, setBudget] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bedroomsContact, setBedroomsContact] = useState("");
  const [preferredContact, setPreferredContact] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPriceLabel, setSelectedPriceLabel] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999999999]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const cookieLoaded = useRef(false);
  const inquiryCookieKey = "rewaciti_student_inquiry";

  // Measures the sticky top bar's real height so the map panel sits exactly below it
  const topBarRef = useRef<HTMLDivElement>(null);
  const [mapTopOffset, setMapTopOffset] = useState(NAVBAR_HEIGHT_PX + 64);

  useLayoutEffect(() => {
    const measure = () => {
      if (topBarRef.current) {
        setMapTopOffset(NAVBAR_HEIGHT_PX + topBarRef.current.offsetHeight);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    const raf = requestAnimationFrame(measure);
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const savedInquiry = getCookie(inquiryCookieKey);
    if (savedInquiry) {
      try {
        const parsed = JSON.parse(savedInquiry);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
        setPreferedLocation(parsed.preferedLocation || "");
        setPreferedCategory(parsed.preferedCategory || "");
        setBedroomsContact(parsed.bedroomsContact || "");
        setBudget(parsed.budget || "");
        setPreferredContact(parsed.preferredContact || "");
        setMessage(parsed.message || "");
        setAgreed(parsed.agreed || false);
      } catch {
        // ignore malformed cookie data
      }
    }

    if (!isAuthenticated || !customer) {
      return;
    }

    const populateProfileDetails = async () => {
      try {
        const profileData = await authAPI.getProfile();
        const latestPhone = profileData.phoneNumber || "";
        setName(
          customer.firstName && customer.lastName
            ? `${customer.firstName} ${customer.lastName}`.trim()
            : customer.firstName || "",
        );
        setEmail(customer.email || "");
        setPhone(latestPhone || customer.phoneNumber || "");

        const currentCustomer = useAuthStore.getState().customer;
        if (currentCustomer && currentCustomer.phoneNumber !== latestPhone) {
          useAuthStore.getState().setCustomer({ ...currentCustomer, phoneNumber: latestPhone });
        }
      } catch (error) {
        console.error("Failed to fetch profile for student area form:", error);
      }
    };

    populateProfileDetails();
  }, [isAuthenticated, customer]);

  useEffect(() => {
    if (!cookieLoaded.current) {
      cookieLoaded.current = true;
      return;
    }

    const payload = {
      name,
      email,
      phone,
      preferedLocation,
      preferedCategory,
      bedroomsContact,
      budget: Budget,
      preferredContact,
      message,
      agreed,
    };

    setCookie(inquiryCookieKey, JSON.stringify(payload));
  }, [name, email, phone, preferedLocation, preferedCategory, bedroomsContact, Budget, preferredContact, message, agreed]);

  // Lock body scroll while the filters modal is open (iOS-safe: freezes scroll position)
  useEffect(() => {
    if (showFilters) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      }
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
    };
  }, [showFilters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim() || !preferedLocation.trim()) {
      toast.error("Please enter your name, email, phone number, and preferred location to continue.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyId: COMPANY_ID,
      pipelineId: "69b49c7541d35d158e336621",
      title: `Student Inquiry from ${name}`,
      name,
      email,
      phone,
      address: preferedLocation,
      note: message || "No additional details added",
      customData: [
        { label: "Budget", value: Budget },
        { label: "Category", value: preferedCategory },
        { label: "Preferred Location", value: preferedLocation },
        { label: "Bedrooms", value: bedroomsContact },
        { label: "Preferred Contact", value: preferredContact },
      ],
    };

    try {
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);
      toast.success(
        <div className="whitespace-pre-wrap">
          Message sent successfully!
          <br />A member of our team will get back to you soon.
        </div>,
      );
      setName("");
      setEmail("");
      setPhone("");
      setPreferedLocation("");
      setPreferedCategory("");
      setBedroomsContact("");
      setBudget("");
      setPreferredContact("");
      setMessage("");
      setAgreed(false);
      setCookie(
        inquiryCookieKey,
        JSON.stringify({
          name: "",
          email: "",
          phone: "",
          preferedLocation: "",
          preferedCategory: "",
          bedroomsContact: "",
          budget: "",
          preferredContact: "",
          message: "",
          agreed: false,
        }),
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const priceOptions = [
    { label: "All Price", range: [0, 999999999] },
    { label: "Below ₦150k", range: [0, 150000] },
    { label: "₦150k - ₦250k", range: [150000, 250000] },
    { label: "₦250k - ₦350k", range: [250000, 350000] },
    { label: "₦350k - ₦500k", range: [350000, 500000] },
    { label: "Above ₦500k", range: [500000, 999999999] },
  ];

  useEffect(() => {
    fetchProperties(1, {
      search: searchTerm || undefined,
      location: location || undefined,
      category: category || undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 999999999 ? priceRange[1] : undefined,
    });
    fetchAreaMaps();
  }, [searchTerm, location, category, bedrooms, priceRange, fetchProperties, fetchAreaMaps]);

  const availableUniversities = useMemo(() => {
    return areaMaps
      .filter((u) => u.areas.some((area) => properties.some((p) => p.location.area === area)))
      .map((u) => ({
        ...u,
        areas: u.areas.filter((area) => properties.some((p) => p.location.area === area)),
      }));
  }, [areaMaps, properties]);

  const universityOptions = [
    { label: "Universities", value: "" },
    ...availableUniversities.map((u) => ({ label: u.name, value: u.id })),
  ];

  const areaOptions = [
    { label: "Areas", value: "" },
    ...(availableUniversities.find((u) => u.id === selectedUniversity)?.areas.map((a) => ({ label: a, value: a })) ?? []),
  ];

  const totalApiPages = Math.max(1, Math.ceil(totalProperties / ITEMS_PER_PAGE));
  const currentProperties = properties;

  const handleNext = () => {
    if (apiPage < totalApiPages) {
      nextPage();
    }
  };

  const handlePrev = () => {
    if (apiPage > 1) {
      prevPage();
    }
  };

  const activeFilterCount = [selectedUniversity, location, category, bedrooms, selectedPriceLabel].filter((v) => v !== "").length;

  const clearAllFilters = () => {
    setUniversity("");
    setLocation("");
    setCategory("");
    setBedrooms("");
    setSelectedPriceLabel("");
    setPriceRange([0, 999999999]);
  };

  return (
    <div>
      <Helmet>
        <title>Student Housing in Ile-Ife | RewaCiti Student Area</title>
        <meta name="description" content="Search student accommodation in Ile-Ife with RewaCiti, including hostels, shared apartments, and student-friendly housing options." />
        <meta property="og:title" content="Student Housing in Ile-Ife | RewaCiti" />
        <meta property="og:description" content="Find student-friendly housing, affordable rentals, and university area homes with RewaCiti." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Student Housing in Ile-Ife | RewaCiti" />
        <meta name="twitter:description" content="Explore student accommodation options around Ile-Ife and university areas with RewaCiti." />
        <link rel="canonical" href="https://rewaciti.com/studentarea" />
      </Helmet>
      <Navbar />

      {/* Top bar: on mobile, General Residence + List/Map toggle share row 1 and Search takes full-width row 2 (grid-cols-2). At md+ it becomes a 3-column grid in Residence / Search / Toggle order via md:order. */}
      <div ref={topBarRef} className="border-b border-gray-500 dark:border-gray-700 dark:bg-[#1A1A1A] bg-gray-200 text-black dark:text-white sticky top-16 z-20 p-0.5" id="StudentCategories">
        <div className="grid grid-cols-2 items-center gap-2.5 px-4 py-3 md:grid-cols-3 md:gap-4">
          {/* General Residence */}
          <div className="flex items-center justify-start md:order-1">
            <NavLink to="/properties" className="bg-[#703BF7] hover:bg-[#9677df] transition text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0">
              🏠 General Residence
            </NavLink>
          </div>

          {/* List / Map toggle */}
          <div className="flex items-center justify-end md:order-3">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800/90 p-1 rounded-xl border border-gray-300 dark:border-neutral-700/60 shrink-0 select-none">
              <button onClick={() => setViewMode("list")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${viewMode === "list" ? "bg-[#703BF7] text-white shadow-md" : "text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25A2.25 2.25 0 0 1 8.25 10.5H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 8.25 20.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25h2.25A2.25 2.25 0 0 1 20.25 6v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75A2.25 2.25 0 0 1 15.75 13.5H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
                List
              </button>

              <button onClick={() => setViewMode("map")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${viewMode === "map" ? "bg-[#703BF7] text-white shadow-md" : "text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75 12 9l3-2.25M9 17.25l3 2.25 3-2.25M9 6.75v10.5m6-12.75v12.75M3 9v12l6-2.25m12-9.75v12l-6-2.25M9 19.5l6-2.25" />
                </svg>
                Map
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="relative w-full col-span-2 md:col-span-1 md:max-w-[400px] md:mx-auto md:order-2">
            <input type="text" placeholder="Search for properties..." className="w-full pl-4 pr-28 py-2.5 rounded-lg dark:bg-black/70 bg-gray-100 text-gray-900 dark:text-white border border-gray-500 dark:border-gray-600 focus:outline-none dark:placeholder-gray-400 placeholder-gray-500 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

            <button onClick={() => setShowFilters(true)} className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 border border-gray-500 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition">
              <FiFilter />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#703BF7] text-white text-[10px] font-semibold w-5 h-5 flex items-center justify-center rounded-full">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-300 dark:bg-black/30 px-4">
        <div className="pt-3 mx-auto">
          <section>
            {viewMode === "map" ? (
              loading || areaLoading ? (
                <div className="w-full h-[600px] rounded-xl flex items-center justify-center bg-gray-200 dark:bg-neutral-800 animate-pulse text-gray-500 dark:text-gray-400">
                  Loading interactive map...
                </div>
              ) : currentProperties.length === 0 ? (
                <div className="w-full h-[600px] rounded-xl flex flex-col items-center justify-center bg-gray-200 dark:bg-neutral-800/50 text-center p-6 border border-gray-300 dark:border-neutral-800">
                  <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-2">No properties found on the map</h3>
                  <p className="text-gray-800 dark:text-gray-400 text-sm">Try adjusting your search or filters to see results.</p>
                </div>
              ) : (
                <>
                  <style>{`
                    @keyframes propertyListShiftLeft { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
                    @keyframes propertyMapSlideInRight { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
                  `}</style>
                  <div className="flex flex-col lg:flex-row gap-4 items-start">
                    <div className="hidden lg:block lg:w-[42%] w-full" style={{ animation: "propertyListShiftLeft 0.35s ease-out" }}>
                      <div>
                        <div className="flex justify-between items-center mb-3 pt-4">
                          <div className="flex-1 flex flex-col justify-center space-y-3 z-10">
                            <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl tracking-tight">Discover properties around campuses</h1>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                          {currentProperties.map((property) => (
                            <div key={property.id} id={`property-card-${property.id}`} onMouseEnter={() => setHoveredPropertyId(property.id)} onMouseLeave={() => setHoveredPropertyId(null)} className={`rounded-xl transition ${hoveredPropertyId === property.id ? "ring-2 ring-[#703BF7]" : "ring-1 ring-transparent"}`}>
                              <PropertyCard property={property} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Map panel: top/height driven by measured mapTopOffset so it starts exactly below the top bar and fills the rest of the viewport */}
                    <div className="w-full lg:w-[58%] lg:sticky z-10" style={{ top: `${mapTopOffset}px`, height: `calc(100vh - ${mapTopOffset}px)`, minHeight: 420, animation: "propertyMapSlideInRight 0.4s ease-out" }}>
                      <PropertyMap
                        properties={currentProperties}
                        heightClassName="h-full"
                        hoveredPropertyId={hoveredPropertyId}
                        onHoverProperty={setHoveredPropertyId}
                        onSelectProperty={(id) => {
                          setHoveredPropertyId(id);
                          document.getElementById(`property-card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                      />
                    </div>
                  </div>
                </>
              )
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6 pt-4">
                  <div className="flex-1 flex flex-col justify-center space-y-3 z-10">
                    <img src="/logo/Abstract Design (1).png" alt="Icon" className="w-13 object-contain" />
                    <div className="flex justify-between items-center">
                      <div className="space-y-3">
                        <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">Discover properties around campuses</h1>
                        <p className="text-gray-800 dark:text-gray-400 text-[14px]">Explore properties around your preferred campus and find convenient accommodation in locations that fit your needs.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {loading || areaLoading ? (
                    [...Array(6)].map((_, i) => <PropertyCardSkeleton key={i} />)
                  ) : currentProperties.length === 0 ? (
                    <div className="col-span-full text-center py-10">
                      <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-2">No properties found</h3>
                      <p className="text-gray-800 dark:text-gray-400 text-sm">Try adjusting your search or filters</p>
                      <p className="text-gray-800 dark:text-gray-400 text-sm">Make sure your connection is stable</p>
                    </div>
                  ) : (
                    currentProperties.map((item) => <PropertyCard key={item.id} property={item} />)
                  )}
                </div>
              </div>
            )}
          </section>

          <hr className="my-4 border-gray-600/50" />

          <div className="flex justify-between items-center text-white">
            <p className="text-sm text-black dark:text-white">Page {apiPage} of {totalApiPages}</p>
            <div className="flex gap-4">
              <button onClick={handlePrev} disabled={apiPage === 1} className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600">
                <FiArrowLeft size={20} />
              </button>
              <button onClick={handleNext} disabled={apiPage >= totalApiPages} className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600">
                <FiArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <PropertyFiltersModal
        mode="student"
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        clearAllFilters={clearAllFilters}
        totalProperties={totalProperties}
        category={category}
        setCategory={setCategory}
        location={location}
        setLocation={setLocation}
        selectedUniversity={selectedUniversity}
        setUniversity={setUniversity}
        bedrooms={bedrooms}
        setBedrooms={setBedrooms}
        selectedPriceLabel={selectedPriceLabel}
        setSelectedPriceLabel={setSelectedPriceLabel}
        setPriceRange={setPriceRange}
        universityOptions={universityOptions}
        areaOptions={areaOptions}
      />

      <section className="bg-gray-300 dark:bg-black/30 py-2 px-4 pt-4 pb-20" id="StudentPortfolio">
        <div className="flex-1 flex flex-col justify-center space-y-3 z-10 mb-6">
          <img src="/logo/Abstract Design (1).png" alt="Icon" className="w-13 object-contain" />
          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">Can't find your preference?</h1>
          <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">Ready to take the first step toward your dream property? Fill out the form below, and our real estate wizards will work their magic to find your perfect match. Don't wait; let's embark on this exciting journey together.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid dark:bg-[#1A1A1A] bg-white grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border border-gray-700/40 rounded-3xl p-4">
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm">Name</label>
            <input type="text" placeholder="Enter Full Name" required value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-4 py-2 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm">Email</label>
            <input type="email" placeholder="Enter your Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-4 py-2 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm">Phone</label>
            <input type="tel" placeholder="Enter Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 px-4 py-2 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm">Preferred Location</label>
            <input type="text" placeholder="Enter Preferred Location" required value={preferedLocation} onChange={(e) => setPreferedLocation(e.target.value)} className="w-full mt-1 px-4 py-2 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">Category</label>
            <CustomDropdown
              placeholder="Category"
              value={preferedCategory}
              options={[
                { label: "Self Contain", value: "Self Contain" },
                { label: "Studio Apartment", value: "Studio Apartment" },
                { label: "Mini Flat", value: "Mini Flat" },
                { label: "Flat", value: "Flat" },
                { label: "Bungalow", value: "Bungalow" },
                { label: "Duplex", value: "Duplex" },
                { label: "Smart Home", value: "Smart Home" },
                { label: "Single Room", value: "Single Room (Shared)" },
                { label: "Shared Room", value: "Shared Room" },
                { label: "Furnished Apartment", value: "Furnished Apartment" },
                { label: "Land", value: "Land" },
              ]}
              onChange={(val) => setPreferedCategory(val)}
            />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm">No of Bedrooms</label>
            <input type="number || text" placeholder="Enter Number of Bedrooms" required min={1} value={bedroomsContact} onChange={(e) => setBedroomsContact(e.target.value)} className="w-full px-4 py-2 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">Budget</label>
            <CustomDropdown placeholder="Price Range" value={Budget} options={priceOptions.map((opt) => ({ label: opt.label, value: opt.label }))} onChange={(val) => setBudget(val)} />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">Preferred Contact Method</label>
            <CustomDropdown
              placeholder="Select Method"
              value={preferredContact}
              options={[
                { label: "Phone", value: "Phone" },
                { label: "Email", value: "Email" },
              ]}
              onChange={(val) => setPreferredContact(val)}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="text-gray-700 dark:text-gray-300 text-sm">Describe What You Want</label>
            <textarea placeholder="Enter your Description here.." rows={3} required value={message} onChange={(e) => setMessage(e.target.value)} className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 resize-none" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              I agree with the{" "}
              <Link to="/terms" target="_blank" rel="noreferrer" className="text-[#703BF7] underline">Terms</Link>{" "}
              and{" "}
              <Link to="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#703BF7] underline">Privacy Policy</Link>.
            </p>
          </div>
          <div className="sm:col-span-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={!agreed || isSubmitting || !name.trim() || !email.trim() || !phone.trim() || !preferedLocation.trim()}
              className={`px-4 py-2 rounded-lg font-medium transition ${agreed && !isSubmitting && name.trim() && email.trim() && phone.trim() && preferedLocation.trim() ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white" : "bg-gray-400 cursor-not-allowed text-gray-200"}`}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </section>
      <section className="bg-gray-300 dark:bg-black/30">
        <Footer />
      </section>
    </div>
  );
}

export default StudentAreaPage;