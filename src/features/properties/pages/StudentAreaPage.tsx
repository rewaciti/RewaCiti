import Navbar from "../../../shared/components/Layout/Navbar";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { usePropertyStore } from "../store/usePropertyStore";
import { useAreaMapStore } from "../../map/store/useAreaMapStore";
import { FiArrowLeft, FiArrowRight, FiMapPin } from "react-icons/fi";
import PropertyCard from "../components/PropertyCard";
import Footer from "../../../shared/components/Layout/Footer";
import { FiFilter } from "react-icons/fi";
import useScrollToHash from "../../../shared/hooks/useScrollToHash";
import { Link, NavLink } from "react-router";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import CustomDropdown from "../components/CustomDropdown";
import { COMPANY_ID, useAuthStore } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { PropertyCardSkeleton } from "../../../shared/components/ui/Skeletons";
import { getCookie, setCookie } from "../../../shared/lib/utils";

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
  const [agreed, setAgreed] = useState(false);
  const cookieLoaded = useRef(false);
  const inquiryCookieKey = "rewaciti_student_inquiry";

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
        setName(customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}`.trim() : customer.firstName || "");
        setEmail(customer.email || "");
        setPhone(latestPhone || customer.phoneNumber || "");

        const currentCustomer = useAuthStore.getState().customer;
        if (currentCustomer && currentCustomer.phoneNumber !== latestPhone) {
          useAuthStore.getState().setCustomer({
            ...currentCustomer,
            phoneNumber: latestPhone,
          });
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
          <br />
          A member of our team will get back to you soon.
        </div>
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
      setCookie(inquiryCookieKey, JSON.stringify({
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
      }));
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

  const categoryOptions = [
    { label: "Categories", value: "" },
    { label: "Self Contain", value: "Self Contain" },
    { label: "Single Room", value: "Single Room" },
    { label: "Mini Flat", value: "Mini Flat" },
    { label: "Shared Room", value: "Shared Room" },
    { label: "Flat", value: "Flat" },
  ];

  const bedroomOptions = [
    { label: "Bedrooms", value: "" },
    { label: "1 Room", value: "1" },
    { label: "2 Rooms", value: "2" },
    { label: "3 Rooms", value: "3" },
    { label: "Shared", value: "shared" },
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

  // Count of currently active filters, shown as a badge on the Filters button
  const activeFilterCount = [
    selectedUniversity,
    location,
    category,
    bedrooms,
    selectedPriceLabel,
  ].filter((v) => v !== "").length;

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
      <div className="relative" id="StudentCategories">
        <div className="bg-linear-to-r dark:from-neutral-600/20 from-gray-300/50 dark:to-black/60 to-gray-400 p-5 py-10 space-y-6 border-b border-gray-600">
          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">Find Student Accommodation</h1>
          <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
            Welcome to RewaCiti, your trusted partner in finding comfortable and affordable student accommodation. Whether you're searching for a hostel, shared apartment, self-contained room and more, we've got options tailored to your needs. Use filters for university, budget, and amenities to discover places that fit your study needs and lifestyle.
          </p>
          <NavLink to="/properties" className="inline-block mt-3 bg-[#703BF7] hover:bg-[#5c2fe0] transition text-white px-4 py-2 rounded-lg text-sm font-medium">
            🏠 General Residence
          </NavLink>
        </div>
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] md:w-[70%]">
          <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-b-none flex">
            <input
              type="text"
              placeholder="Search For Properties by name, location, or area..."
              className="p-3 flex justify-center items-center dark:placeholder-gray-400 placeholder-gray-900/70 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none border border-gray-600/70 w-full rounded-b-none rounded-tr-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => setShowFilters(true)}
              className="relative flex items-center gap-2 px-4 py-2 dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white rounded-lg border border-gray-600 rounded-tl-none rounded-b-none md:rounded-tr-lg"
            >
              <FiFilter />
              <span className="hidden sm:inline text-sm">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#703BF7] text-white text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full animate-scale-in">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-300 dark:bg-black/30 px-4">
        <div className="pt-8 mx-auto">
          <section>
            <div className="flex justify-between items-center mb-6 pt-4">
              <div className="flex-1 flex flex-col justify-center space-y-3 z-10">
                <img src="/logo/Abstract Design (1).png" alt="Icon" className="w-13 object-contain" />
                <div className="flex justify-between items-center">
                  <div className="space-y-3">
                    <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">Discover a World of Possibilities</h1>
                    <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
                      Our portfolio of properties is as diverse as your dreams. Explore the following categories to find the perfect property that resonates with your vision of home.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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

      {/* Filters Modal — overlay-backed, doesn't shift page layout */}
      <div className={`fixed inset-0 z-50 flex items-end md:items-center justify-center transition-opacity duration-300 ${
        showFilters ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}>
        {/* backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            showFilters ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setShowFilters(false)}
        />

        {/* panel */}
        <div className={`relative w-full md:w-[540px] max-h-[90vh] md:max-h-[85vh] bg-white dark:bg-[#1A1A1A] rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ease-out transform ${
          showFilters 
            ? "translate-y-0 opacity-100 scale-100" 
            : "translate-y-full md:translate-y-10 opacity-0 scale-95"
        }`}>
            {/* header */}
            <div className="flex items-center justify-center relative px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-gray-900 dark:text-white font-semibold text-base">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="absolute right-4 text-gray-900 dark:text-white hover:opacity-60 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* body — scrollable */}
            <div className="overflow-y-auto px-6 py-5">

              {/* University & Area */}
              <div className="pb-6">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">University</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
                    <CustomDropdown
                      icon={<FiMapPin />}
                      placeholder="University"
                      value={selectedUniversity}
                      options={universityOptions}
                      onChange={(value) => {
                        setUniversity(value);
                        setLocation("");
                      }}
                    />
                  </div>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
                    <CustomDropdown
                      icon={<FiMapPin />}
                      placeholder={selectedUniversity ? "Area" : "Choose University First"}
                      value={location}
                      options={areaOptions}
                      disabled={!selectedUniversity}
                      onChange={setLocation}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Type of place */}
              <div className="py-6">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Type of place</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setCategory("")}
                    className={`px-4 py-3 rounded-full border text-sm font-medium transition ${
                      category === ""
                        ? "border-black dark:border-white border-2 text-gray-900 dark:text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                    }`}
                  >
                    Any
                  </button>
                  {categoryOptions
                    .filter((opt) => opt.value !== "")
                    .map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setCategory(opt.value)}
                        className={`px-4 py-3 rounded-full border text-sm font-medium transition ${
                          category === opt.value
                            ? "border-black dark:border-white border-2 text-gray-900 dark:text-white"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Rooms */}
              <div className="py-6">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Rooms</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setBedrooms("")}
                    className={`px-4 py-3 rounded-full border text-sm font-medium transition ${
                      bedrooms === ""
                        ? "border-black dark:border-white border-2 text-gray-900 dark:text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                    }`}
                  >
                    Any
                  </button>
                  {bedroomOptions
                    .filter((opt) => opt.value !== "")
                    .map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setBedrooms(opt.value)}
                        className={`px-4 py-3 rounded-full border text-sm font-medium transition ${
                          bedrooms === opt.value
                            ? "border-black dark:border-white border-2 text-gray-900 dark:text-white"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Budget */}
              <div className="pt-6">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Budget</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedPriceLabel("");
                      setPriceRange([0, 999999999]);
                    }}
                    className={`px-4 py-3 rounded-full border text-sm font-medium transition ${
                      selectedPriceLabel === ""
                        ? "border-black dark:border-white border-2 text-gray-900 dark:text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                    }`}
                  >
                    Any
                  </button>
                  {priceOptions
                    .filter((opt) => opt.label !== "All Price")
                    .map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          setSelectedPriceLabel(opt.label);
                          setPriceRange(opt.range as [number, number]);
                        }}
                        className={`px-4 py-3 rounded-full border text-sm font-medium transition ${
                          selectedPriceLabel === opt.label
                            ? "border-black dark:border-white border-2 text-gray-900 dark:text-white"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearAllFilters}
                className="text-gray-900 dark:text-white underline text-sm font-medium"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="bg-[#703BF7] hover:bg-[#5c2fe0] text-white px-5 py-3 rounded-full text-sm font-semibold"
              >
                Show {totalProperties} {totalProperties === 1 ? "place" : "places"}
              </button>
            </div>
          </div>
        </div>

      <section className="bg-gray-300 dark:bg-black/30 py-2 px-4 pt-4 pb-20" id="StudentPortfolio">
        <div className="flex-1 flex flex-col justify-center space-y-3 z-10 mb-6">
          <img src="/logo/Abstract Design (1).png" alt="Icon" className="w-13 object-contain" />
          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">Can't find your preference?</h1>
          <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
            Ready to take the first step toward your dream property? Fill out the form below, and our real estate wizards will work their magic to find your perfect match. Don't wait; let's embark on this exciting journey together.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid dark:bg-[#1A1A1A] bg-white grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border border-gray-700/40 rounded-3xl p-4 md:p-10">
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm">Name</label>
            <input type="text" placeholder="Enter Full Name" required value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm">Email</label>
            <input type="email" placeholder="Enter your Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm">Phone</label>
            <input type="tel" placeholder="Enter Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm">Preferred Location</label>
            <input type="text" placeholder="Enter Preferred Location" required value={preferedLocation} onChange={(e) => setPreferedLocation(e.target.value)} className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">Category</label>
            <CustomDropdown placeholder="Category" value={preferedCategory} options={[{ label: "Self Contain", value: "Self Contain" }, { label: "Studio Apartment", value: "Studio Apartment" }, { label: "Mini Flat", value: "Mini Flat" }, { label: "Flat", value: "Flat" }, { label: "Bungalow", value: "Bungalow" }, { label: "Duplex", value: "Duplex" }, { label: "Smart Home", value: "Smart Home" }, { label: "Single Room", value: "Single Room (Shared)" }, { label: "Shared Room", value: "Shared Room" }, { label: "Furnished Apartment", value: "Furnished Apartment" }, { label: "Land", value: "Land"}]} onChange={(val) => setPreferedCategory(val)} />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm">No of Bedrooms</label>
            <input type="number || text" placeholder="Enter Number of Bedrooms" required min={1} value={bedroomsContact} onChange={(e) => setBedroomsContact(e.target.value)} className="w-full mt-1 p-3 py-2.5 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">Budget</label>
            <CustomDropdown placeholder="Price Range" value={Budget} options={priceOptions.map((opt) => ({ label: opt.label, value: opt.label }))} onChange={(val) => setBudget(val)} />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">Preferred Contact Method</label>
            <CustomDropdown placeholder="Select Method" value={preferredContact} options={[{ label: "Phone", value: "Phone" }, { label: "Email", value: "Email" }]} onChange={(val) => setPreferredContact(val)} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="text-gray-700 dark:text-gray-300 text-sm">Describe What You Want</label>
            <textarea placeholder="Enter your Description here.." rows={4} required value={message} onChange={(e) => setMessage(e.target.value)} className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 resize-none" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <p className="text-sm text-gray-700 dark:text-gray-300 ">
                  I agree with the <Link to="/terms" target="_blank" rel="noreferrer" className="text-[#703BF7] underline">Terms</Link> and <Link to="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#703BF7] underline">Privacy Policy</Link>.
                </p>
          </div>
          <div className="sm:col-span-2 flex items-center justify-end">
            <button type="submit" disabled={!agreed || isSubmitting || !name.trim() || !email.trim() || !phone.trim() || !preferedLocation.trim()} className={`px-4 py-3 rounded-lg font-medium transition ${agreed && !isSubmitting && name.trim() && email.trim() && phone.trim() && preferedLocation.trim() ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white" : "bg-gray-400 cursor-not-allowed text-gray-200"}`}>
              {isSubmitting ? "Sending..." : "Send Your Message"}
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