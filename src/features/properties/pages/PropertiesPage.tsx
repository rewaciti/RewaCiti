import Navbar from "../../../shared/components/Layout/Navbar";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import { usePropertyStore } from "../store/usePropertyStore";
import {
  customFieldsAPI,
  type CustomFieldsResponse,
  type LocationHierarchyItem,
} from "../services/customFieldsAPI";
import { FiArrowLeft, FiArrowRight, FiFilter } from "react-icons/fi";
import PropertyCard from "../components/PropertyCard";
import PropertyMap from "../components/PropertyMap";
import Footer from "../../../shared/components/Layout/Footer";
import useScrollToHash from "../../../shared/hooks/useScrollToHash";
import { Link } from "react-router";
import { PropertyCardSkeleton } from "../../../shared/components/ui/Skeletons";
import { toast } from "sonner";
import CustomDropdown from "../../../features/properties/components/CustomDropdown.tsx";
import PropertyFiltersModal from "../components/PropertyFiltersModal";
import { COMPANY_ID, useAuthStore } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { getCookie, setCookie } from "../../../shared/lib/utils";

// Height of Navbar (top-16 = 4rem) — used to offset the sticky map panel
const NAVBAR_HEIGHT_PX = 64;

function PropertySearchSection() {
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
    categories,
    fetchCategories,
  } = usePropertyStore();

  const [searchTerm, setSearchTerm] = useState("");

  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [university, setUniversity] = useState("");
  const [category, setCategory] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [listingType, setListingType] = useState("");
  const [selectedPriceLabel, setSelectedPriceLabel] = useState("");

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

  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0, 999999999,
  ]);

  const [bedroomCount, setBedroomCount] = useState(0);
  const [sharedRoomOnly, setSharedRoomOnly] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(
    null,
  );
  const [agreed, setAgreed] = useState(false);
  const [listingTypes, setListingTypes] = useState<string[]>([]);
  const cookieLoaded = useRef(false);
  const inquiryCookieKey = "rewaciti_property_inquiry";

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
          useAuthStore
            .getState()
            .setCustomer({ ...currentCustomer, phoneNumber: latestPhone });
        }
      } catch (error) {
        console.error(
          "Failed to fetch profile for properties page form:",
          error,
        );
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
  }, [
    name,
    email,
    phone,
    preferedLocation,
    preferedCategory,
    bedroomsContact,
    Budget,
    preferredContact,
    message,
    agreed,
  ]);

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

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !preferedLocation.trim()
    ) {
      toast.error(
        "Please enter your name, email, phone number, and preferred location to continue.",
      );
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyId: COMPANY_ID,
      pipelineId: "69b49c7541d35d158e336621",
      title: `Property Inquiry from ${name}`,
      name: name,
      email: email,
      phone: phone,
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
    { label: "Below ₦100k", range: [0, 100000] },
    { label: "₦100k - ₦200k", range: [100001, 200000] },
    { label: "₦200k - ₦300k", range: [200001, 300000] },
    { label: "₦300k - ₦400k", range: [300001, 400000] },
    { label: "₦400k - ₦500k", range: [400001, 500000] },
    { label: "₦500k - ₦700k", range: [500001, 700000] },
    { label: "₦700k - ₦1M", range: [700001, 1000000] },
    { label: "Above ₦1M", range: [1000001, 999999999] },
  ];

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const [locationHierarchy, setLocationHierarchy] = useState<
    LocationHierarchyItem[]
  >([]);
  const [customFilterValues, setCustomFilterValues] =
    useState<CustomFieldsResponse | null>(null);

  // Fetch custom fields data and location hierarchy from backend
  useEffect(() => {
    const fetchCustomFields = async () => {
      try {
        const [filterData, hierarchyData] = await Promise.all([
          customFieldsAPI.getFilterValues(),
          customFieldsAPI.getLocationHierarchy(),
        ]);

        setCustomFilterValues(filterData);
        setLocationHierarchy(hierarchyData);
        setListingTypes(filterData.listing_type || []);
      } catch (error) {
        console.error("Failed to fetch custom fields:", error);
      }
    };

    fetchCustomFields();
  }, []);

  useEffect(() => {
    if (sharedRoomOnly) {
      setBedrooms("shared");
    } else if (bedroomCount > 0) {
      setBedrooms(String(bedroomCount));
    } else {
      setBedrooms("");
    }
  }, [bedroomCount, sharedRoomOnly]);

  useEffect(() => {
    if (bedrooms === "shared") {
      setSharedRoomOnly(true);
      setBedroomCount(0);
    } else if (["1", "2", "3"].includes(bedrooms)) {
      setBedroomCount(Number(bedrooms));
      setSharedRoomOnly(false);
    } else if (bedrooms === "") {
      setBedroomCount(0);
      setSharedRoomOnly(false);
    }
  }, [bedrooms]);

  useEffect(() => {
    const min =
      minPriceInput.trim() === "" ? 0 : Math.max(0, Number(minPriceInput));
    const max =
      maxPriceInput.trim() === ""
        ? 999999999
        : Math.max(0, Number(maxPriceInput));

    if (Number.isNaN(min) || Number.isNaN(max)) return;

    setPriceRange([min, max]);
  }, [minPriceInput, maxPriceInput]);

  useEffect(() => {
    const isCategoryId = categories.some(
      (option) => String(option.id) === String(category),
    );

    fetchProperties(1, {
      search: searchTerm || undefined,
      "customData.location.state": state || undefined,
      "customData.location.city_town": city || undefined,
      "customData.location.area": area || undefined,
      "customData.location.nearest_institution_in_full":
        university || undefined,
      ...(category
        ? isCategoryId
          ? { categoryId: category }
          : { category }
        : {}),
      "customData.bedrooms": bedrooms || undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 999999999 ? priceRange[1] : undefined,
      "customData.listing_type": listingType || undefined,
    });
  }, [
    searchTerm,
    category,
    bedrooms,
    state,
    city,
    area,
    university,
    priceRange,
    fetchProperties,
    listingType,
    categories,
  ]);

  const totalApiPages = Math.max(
    1,
    Math.ceil(totalProperties / ITEMS_PER_PAGE),
  );
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

  // 1. Available States (from hierarchy & custom filter values)
  const stateOptions = useMemo(() => {
    const stateMap = new Map<string, string>();

    locationHierarchy.forEach((item) => {
      if (item.state) {
        const lower = item.state.toLowerCase();
        if (!stateMap.has(lower)) {
          stateMap.set(lower, item.state);
        }
      }
    });

    (customFilterValues?.["location.state"] || []).forEach((s) => {
      if (s) {
        const lower = s.toLowerCase();
        if (!stateMap.has(lower)) {
          stateMap.set(lower, s);
        }
      }
    });

    return Array.from(stateMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([_, val]) => ({ label: val, value: val }));
  }, [locationHierarchy, customFilterValues]);

  // 2. Available Cities (only when state is selected)
  const cityOptions = useMemo(() => {
    if (!state) return [];
    const cityMap = new Map<string, string>();
    const stateLower = state.toLowerCase();

    locationHierarchy.forEach((item) => {
      if (item.state.toLowerCase() === stateLower && item.city) {
        const lower = item.city.toLowerCase();
        if (!cityMap.has(lower)) {
          cityMap.set(lower, item.city);
        }
      }
    });

    (customFilterValues?.["location.city_town"] || []).forEach((c) => {
      if (c) {
        const matching = locationHierarchy.some(
          (item) =>
            item.state.toLowerCase() === stateLower &&
            item.city.toLowerCase() === c.toLowerCase(),
        );
        if (matching) {
          const lower = c.toLowerCase();
          if (!cityMap.has(lower)) {
            cityMap.set(lower, c);
          }
        }
      }
    });

    return Array.from(cityMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([_, val]) => ({ label: val, value: val }));
  }, [state, locationHierarchy, customFilterValues]);

  // 3. Available Areas (only when state is selected, filtered further if city is chosen)
  const areaOptions = useMemo(() => {
    if (!state) return [];
    const areaMap = new Map<string, string>();
    const stateLower = state.toLowerCase();
    const cityLower = city ? city.toLowerCase() : "";

    locationHierarchy.forEach((item) => {
      if (item.state.toLowerCase() === stateLower) {
        if (!cityLower || item.city.toLowerCase() === cityLower) {
          if (item.area) {
            const lower = item.area.toLowerCase();
            if (!areaMap.has(lower)) {
              areaMap.set(lower, item.area);
            }
          }
        }
      }
    });

    (customFilterValues?.["location.area"] || []).forEach((a) => {
      if (a) {
        const matching = locationHierarchy.some(
          (item) =>
            item.state.toLowerCase() === stateLower &&
            (!cityLower || item.city.toLowerCase() === cityLower) &&
            item.area.toLowerCase() === a.toLowerCase(),
        );
        if (matching) {
          const lower = a.toLowerCase();
          if (!areaMap.has(lower)) {
            areaMap.set(lower, a);
          }
        }
      }
    });

    return Array.from(areaMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([_, val]) => ({ label: val, value: val }));
  }, [state, city, locationHierarchy, customFilterValues]);

  // 4. Available Universities (filtered by state if state is selected)
  const universityOptions = useMemo(() => {
    const uniMap = new Map<string, string>();
    const stateLower = state ? state.toLowerCase() : "";

    locationHierarchy.forEach((item) => {
      if (item.university) {
        if (!stateLower || item.state.toLowerCase() === stateLower) {
          const lower = item.university.toLowerCase();
          if (!uniMap.has(lower)) {
            uniMap.set(lower, item.university);
          }
        }
      }
    });

    (
      customFilterValues?.["location.nearest_institution_in_full"] || []
    ).forEach((u) => {
      if (u) {
        if (!stateLower) {
          const lower = u.toLowerCase();
          if (!uniMap.has(lower)) {
            uniMap.set(lower, u);
          }
        } else {
          const matching = locationHierarchy.some(
            (item) =>
              item.state.toLowerCase() === stateLower &&
              item.university?.toLowerCase() === u.toLowerCase(),
          );
          if (matching) {
            const lower = u.toLowerCase();
            if (!uniMap.has(lower)) {
              uniMap.set(lower, u);
            }
          }
        }
      }
    });

    return Array.from(uniMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([_, val]) => ({ label: val, value: val }));
  }, [state, locationHierarchy, customFilterValues]);

  // Cascading Selection Handlers
  const handleStateChange = (selectedState: string) => {
    setState(selectedState);
    if (!selectedState) {
      setCity("");
      setArea("");
      return;
    }

    const stateLower = selectedState.toLowerCase();
    const validCities = locationHierarchy
      .filter((i) => i.state.toLowerCase() === stateLower)
      .map((i) => i.city.toLowerCase());

    if (city && !validCities.includes(city.toLowerCase())) {
      setCity("");
    }

    const validAreas = locationHierarchy
      .filter((i) => i.state.toLowerCase() === stateLower)
      .map((i) => i.area.toLowerCase());

    if (area && !validAreas.includes(area.toLowerCase())) {
      setArea("");
    }

    const validUnis = locationHierarchy
      .filter((i) => i.state.toLowerCase() === stateLower)
      .map((i) => (i.university || "").toLowerCase());

    if (university && !validUnis.includes(university.toLowerCase())) {
      setUniversity("");
    }
  };

  const handleCityChange = (selectedCity: string) => {
    setCity(selectedCity);
    if (!selectedCity) {
      setArea("");
      return;
    }

    const stateLower = state.toLowerCase();
    const cityLower = selectedCity.toLowerCase();
    const validAreas = locationHierarchy
      .filter(
        (i) =>
          i.state.toLowerCase() === stateLower &&
          i.city.toLowerCase() === cityLower,
      )
      .map((i) => i.area.toLowerCase());

    if (area && !validAreas.includes(area.toLowerCase())) {
      setArea("");
    }
  };

  const handleAreaChange = (selectedArea: string) => {
    setArea(selectedArea);
    if (selectedArea && !city && state) {
      const match = locationHierarchy.find(
        (i) =>
          i.state.toLowerCase() === state.toLowerCase() &&
          i.area.toLowerCase() === selectedArea.toLowerCase(),
      );
      if (match && match.city) {
        setCity(match.city);
      }
    }
  };

  const handleUniversityChange = (selectedUniversity: string) => {
    setUniversity(selectedUniversity);
    if (selectedUniversity) {
      const match = locationHierarchy.find(
        (i) =>
          (i.university || "").toLowerCase() ===
          selectedUniversity.toLowerCase(),
      );
      if (match) {
        if (match.state && match.state.toLowerCase() !== state.toLowerCase()) {
          setState(match.state);
        }
        if (match.city && match.city.toLowerCase() !== city.toLowerCase()) {
          setCity(match.city);
        }
      }
    }
  };

  const categoryOptions = [
    { label: "Categories", value: "" },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];

  const listingTypeOptions = [
    { label: "Listing Type", value: "" },
    ...listingTypes.map((lt) => ({ label: lt, value: lt })),
  ];

  const activeFilterCount = [
    state,
    city,
    area,
    university,
    category,
    bedroomCount > 0 ? "x" : "",
    sharedRoomOnly ? "x" : "",
    selectedPriceLabel,
    minPriceInput.trim() !== "" ? "x" : "",
    maxPriceInput.trim() !== "" ? "x" : "",
    listingType,
  ].filter((v) => v !== "").length;

  const clearAllFilters = () => {
    setState("");
    setCity("");
    setArea("");
    setUniversity("");
    setCategory("");
    setBedroomCount(0);
    setSharedRoomOnly(false);
    setMinPriceInput("");
    setMaxPriceInput("");
    setSelectedPriceLabel("");
    setListingType("");
    setPriceRange([0, 999999999]);
    setBedrooms("");
  };

  return (
    <div>
      <Helmet>
        <title>Properties | RewaCiti</title>
        <meta
          name="description"
          content="Browse available properties on RewaCiti, including rentals and homes in Ile-Ife and surrounding areas."
        />
        <meta property="og:title" content="Properties | RewaCiti" />
        <meta
          property="og:description"
          content="Search top real estate listings, rentals, and student accommodations on RewaCiti."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://rewaciti.com/properties" />
      </Helmet>
      <Navbar />

      <div
        ref={topBarRef}
        className="border-b border-gray-400 dark:border-neutral-800 bg-gray-300 dark:bg-[#1A1A1A] text-gray-900 dark:text-white sticky top-16 z-20 p-0.5"
        id="Categories"
      >
        <div className="px-4 py-3">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search for properties..."
              className="w-full pl-4 pr-28 py-2.5 rounded-lg dark:bg-black/70 bg-gray-100 text-gray-900 dark:text-white border border-gray-500 dark:border-gray-600 focus:outline-none dark:placeholder-gray-400 placeholder-gray-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <button
              onClick={() => setShowFilters(true)}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 border border-gray-500 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
            >
              <FiFilter />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#703BF7] text-white text-[10px] font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-3">
            {/* Small screens: explicit, scrollable Listing Type pills + toggle */}
            <div className="lg:hidden flex items-center gap-1.5">
              <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setCategory("")}
                  className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
                    category === ""
                      ? "bg-[#703BF7] border-[#703BF7] text-white"
                      : "border-gray-400 dark:border-neutral-700 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-neutral-900"
                  }`}
                >
                  All
                </button>

                {categoryOptions
                  .filter((opt) => opt.value !== "")
                  .map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCategory(opt.value)}
                      className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold transition whitespace-nowrap ${
                        category === opt.value
                          ? "bg-[#703BF7] border-[#703BF7] text-white"
                          : "border-gray-400 dark:border-neutral-700 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-neutral-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
              </div>

              <div className="shrink-0">
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800/90 p-1 rounded-xl border border-gray-300 dark:border-neutral-700/60 select-none">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${viewMode === "list" ? "bg-[#703BF7] text-white shadow-md" : "text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25A2.25 2.25 0 0 1 8.25 10.5H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 8.25 20.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25h2.25A2.25 2.25 0 0 1 20.25 6v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75A2.25 2.25 0 0 1 15.75 13.5H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                      />
                    </svg>
                    List
                  </button>

                  <button
                    onClick={() => setViewMode("map")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${viewMode === "map" ? "bg-[#703BF7] text-white shadow-md" : "text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 6.75 12 9l3-2.25M9 17.25l3 2.25 3-2.25M9 6.75v10.5m6-12.75v12.75M3 9v12l6-2.25m12-9.75v12l-6-2.25M9 19.5l6-2.25"
                      />
                    </svg>
                    Map
                  </button>
                </div>
              </div>
            </div>

            {/* Large screens: unchanged dropdown row */}
            <div className="hidden lg:flex items-center justify-between gap-1.5 overflow-visible">
              <div className="flex-1 min-w-0 overflow-visible">
                <div className="flex flex-nowrap items-center gap-1.5 overflow-visible">
                  <div className="min-w-[110px] sm:min-w-[170px] md:min-w-[190px] lg:min-w-[220px]">
                    <CustomDropdown
                      placeholder="University"
                      value={university}
                      options={[
                        { label: "All Universities", value: "" },
                        ...universityOptions,
                      ]}
                      onChange={handleUniversityChange}
                      className="w-full"
                      buttonClassName="w-full h-9 px-2.5 flex items-center justify-between rounded-lg border border-gray-500 bg-gray-100 font-bold dark:border-neutral-700 dark:bg-neutral-900 text-gray-900 dark:text-white text-[10px] sm:text-xs"
                    />
                  </div>

                  <div className="min-w-[95px] sm:min-w-[150px] md:min-w-[170px] lg:min-w-[200px]">
                    <CustomDropdown
                      placeholder="State"
                      value={state}
                      options={[
                        { label: "All States", value: "" },
                        ...stateOptions,
                      ]}
                      onChange={handleStateChange}
                      className="w-full"
                      buttonClassName="w-full h-9 px-2.5 flex items-center justify-between rounded-lg border border-gray-500 bg-gray-100 font-bold dark:border-neutral-700 dark:bg-neutral-900 text-gray-900 dark:text-white text-[10px] sm:text-xs"
                    />
                  </div>

                  <div className="min-w-[90px] sm:min-w-[140px] md:min-w-40 lg:min-w-[190px]">
                    <CustomDropdown
                      placeholder={state ? "City" : "Select State first"}
                      value={city}
                      options={[
                        { label: "All Cities", value: "" },
                        ...cityOptions,
                      ]}
                      onChange={handleCityChange}
                      disabled={!state}
                      className="w-full"
                      buttonClassName="w-full h-9 px-2.5 flex items-center justify-between rounded-lg border border-gray-500 font-bold bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 text-gray-900 dark:text-white text-[10px] sm:text-xs"
                    />
                  </div>

                  <div className="min-w-[90px] sm:min-w-[140px] md:min-w-40 lg:min-w-[190px]">
                    <CustomDropdown
                      placeholder={state ? "Area" : "Select State first"}
                      value={area}
                      options={[
                        { label: "All Areas", value: "" },
                        ...areaOptions,
                      ]}
                      onChange={handleAreaChange}
                      disabled={!state}
                      className="w-full"
                      buttonClassName="w-full h-9 px-2.5 flex items-center justify-between rounded-lg border border-gray-500 font-bold bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 text-gray-900 dark:text-white text-[10px] sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end shrink-0">
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800/90 p-1 rounded-xl border border-gray-300 dark:border-neutral-700/60 select-none">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${viewMode === "list" ? "bg-[#703BF7] text-white shadow-md" : "text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25A2.25 2.25 0 0 1 8.25 10.5H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 8.25 20.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25h2.25A2.25 2.25 0 0 1 20.25 6v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75A2.25 2.25 0 0 1 15.75 13.5H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                      />
                    </svg>
                    List
                  </button>

                  <button
                    onClick={() => setViewMode("map")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${viewMode === "map" ? "bg-[#703BF7] text-white shadow-md" : "text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 6.75 12 9l3-2.25M9 17.25l3 2.25 3-2.25M9 6.75v10.5m6-12.75v12.75M3 9v12l6-2.25m12-9.75v12l-6-2.25M9 19.5l6-2.25"
                      />
                    </svg>
                    Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-300 dark:bg-black/30 px-4">
        <div className="pt-3 mx-auto">
          <section>
            {viewMode === "map" ? (
              loading ? (
                <div className="w-full h-[600px] rounded-xl flex items-center justify-center bg-gray-200 dark:bg-neutral-800 animate-pulse text-gray-500 dark:text-gray-400">
                  Loading interactive map...
                </div>
              ) : currentProperties.length === 0 ? (
                <div className="w-full h-[600px] rounded-xl flex flex-col items-center justify-center bg-gray-200 dark:bg-neutral-800/50 text-center p-6 border border-gray-300 dark:border-neutral-800">
                  <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-2">
                    No properties found on the map
                  </h3>
                  <p className="text-gray-800 dark:text-gray-400 text-sm">
                    Try adjusting your search or filters to see results.
                  </p>
                </div>
              ) : (
                <>
                  <style>{`
                    @keyframes propertyListShiftLeft { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
                    @keyframes propertyMapSlideInRight { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
                  `}</style>
                  <div className="flex flex-col lg:flex-row gap-4 items-start">
                    <div
                      className="hidden lg:block lg:w-[42%] w-full"
                      style={{
                        animation: "propertyListShiftLeft 0.35s ease-out",
                      }}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3 pt-4">
                          <div className="flex-1 flex flex-col justify-center space-y-3 z-10">
                            <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl tracking-tight">
                              Discover a World of Possibilities
                            </h1>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                          {currentProperties.map((property) => (
                            <div
                              key={property.id}
                              id={`property-card-${property.id}`}
                              onMouseEnter={() =>
                                setHoveredPropertyId(property.id)
                              }
                              onMouseLeave={() => setHoveredPropertyId(null)}
                              className={`rounded-xl transition ${hoveredPropertyId === property.id ? "ring-2 ring-[#703BF7]" : "ring-1 ring-transparent"}`}
                            >
                              <PropertyCard property={property} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Map panel: top/height driven by measured mapTopOffset so it starts exactly below the top bar and fills the rest of the viewport */}
                    <div
                      className="w-full lg:w-[58%] lg:sticky z-10"
                      style={{
                        top: `${mapTopOffset}px`,
                        height: `calc(100vh - ${mapTopOffset}px)`,
                        minHeight: 420,
                        animation: "propertyMapSlideInRight 0.4s ease-out",
                      }}
                    >
                      <PropertyMap
                        properties={currentProperties}
                        heightClassName="h-full"
                        hoveredPropertyId={hoveredPropertyId}
                        onHoverProperty={setHoveredPropertyId}
                        onSelectProperty={(id) => {
                          setHoveredPropertyId(id);
                          document
                            .getElementById(`property-card-${id}`)
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
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
                    <img
                      src="/logo/Abstract Design (1).png"
                      alt="Icon"
                      className="w-13 object-contain"
                    />
                    <div className="flex justify-between items-center">
                      <div className="space-y-3">
                        <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
                          Discover properties around campuses
                        </h1>
                        <p className="text-gray-800 dark:text-gray-400 text-[14px]">
                          Explore properties around your preferred campus and
                          find convenient accommodation in locations that fit
                          your needs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <PropertyCardSkeleton key={i} />
                    ))
                  ) : currentProperties.length === 0 ? (
                    <div className="col-span-full text-center py-10">
                      <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-2">
                        No properties found
                      </h3>
                      <p className="text-gray-800 dark:text-gray-400 text-sm">
                        Try adjusting your search or filters
                      </p>
                      <p className="text-gray-800 dark:text-gray-400 text-sm">
                        Make sure your connection is stable
                      </p>
                    </div>
                  ) : (
                    currentProperties.map((item) => (
                      <PropertyCard key={item.id} property={item} />
                    ))
                  )}
                </div>
              </div>
            )}
          </section>

          <hr className="my-4 border-gray-600/50" />

          <div className="flex justify-between items-center text-white">
            <p className="text-sm text-black dark:text-white">
              Page {apiPage} of {totalApiPages}
            </p>

            <div className="flex gap-4">
              <button
                onClick={handlePrev}
                disabled={apiPage === 1}
                className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600"
              >
                <FiArrowLeft size={20} />
              </button>

              <button
                onClick={handleNext}
                disabled={apiPage >= totalApiPages}
                className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600"
              >
                <FiArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <PropertyFiltersModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        clearAllFilters={clearAllFilters}
        totalProperties={totalProperties}
        category={category}
        setCategory={setCategory}
        state={state}
        onStateChange={handleStateChange}
        city={city}
        onCityChange={handleCityChange}
        area={area}
        onAreaChange={handleAreaChange}
        university={university}
        onUniversityChange={handleUniversityChange}
        stateOptions={stateOptions}
        cityOptions={cityOptions}
        areaOptions={areaOptions}
        universityOptions={universityOptions}
        minPriceInput={minPriceInput}
        setMinPriceInput={setMinPriceInput}
        maxPriceInput={maxPriceInput}
        setMaxPriceInput={setMaxPriceInput}
        bedroomCount={bedroomCount}
        setBedroomCount={setBedroomCount}
        sharedRoomOnly={sharedRoomOnly}
        setSharedRoomOnly={setSharedRoomOnly}
        categories={categoryOptions}
        listingType={listingType}
        setListingType={setListingType}
        listingTypeOptions={listingTypeOptions}
      />

      <section
        className="bg-gray-300 dark:bg-black/30 px-4 py-2 pt-4 pb-20"
        id="Portfolio"
      >
        <div>
          <div className="flex-1 flex flex-col justify-center space-y-3 z-10 mb-6">
            <img
              src="/logo/Abstract Design (1).png"
              alt="Icon"
              className="w-13 object-contain"
            />
            <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
              Can't find your preference?
            </h1>
            <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
              Ready to take the first step toward your dream property? Fill out
              the form below, and our real estate wizards will work their magic
              to find your perfect match. Don't wait; let's embark on this
              exciting journey together.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid dark:bg-[#1A1A1A] bg-white grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border border-gray-700/40 rounded-3xl p-4"
          >
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">
                Name
              </label>
              <input
                type="text"
                placeholder="Enter Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">
                Phone
              </label>
              <input
                type="tel"
                placeholder="Enter Phone Number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">
                Preferred Location
              </label>
              <input
                type="text"
                placeholder="Enter Prefered Location"
                required
                value={preferedLocation}
                onChange={(e) => setPreferedLocation(e.target.value)}
                className="w-full px-4 py-2 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                Category
              </label>
              <CustomDropdown
                placeholder="Category"
                value={preferedCategory}
                options={[
                  { label: "None here", value: "none" },
                  { label: "Self Contain", value: "Self Contain" },
                  { label: "Studio Apartment", value: "Studio Apartment" },
                  { label: "Mini Flat", value: "Mini Flat" },
                  { label: "Flat", value: "Flat" },
                  { label: "Bungalow", value: "Bungalow" },
                  { label: "Duplex", value: "Duplex" },
                  { label: "Mansion", value: "Mansion" },
                  { label: "Villa", value: "Villa" },
                  { label: "Smart Home", value: "Smart Home" },
                  { label: "Single Room", value: "Single Room (Shared)" },
                  { label: "Shared Room", value: "Shared Room" },
                  { label: "Land", value: "Land" },
                  {
                    label: "Uncompleted Building",
                    value: "Uncompleted Building",
                  },
                ]}
                onChange={(val) => setPreferedCategory(val)}
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">
                No of Bedrooms
              </label>
              <input
                type="number||text"
                placeholder="Enter Number of Bedrooms"
                required
                min={1}
                value={bedroomsContact}
                onChange={(e) => setBedroomsContact(e.target.value)}
                className="w-full px-4 py-2 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                Budget
              </label>
              <CustomDropdown
                placeholder="Price Range"
                value={Budget}
                options={priceOptions.map((opt) => ({
                  label: opt.label,
                  value: opt.label,
                }))}
                onChange={(val) => setBudget(val)}
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                Preferred Contact Method
              </label>
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
              <label className="text-gray-700 dark:text-gray-300 text-sm">
                Describe What You Want
              </label>
              <textarea
                placeholder="Enter your Description here.."
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 resize-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                I agree with the{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#703BF7] underline"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#703BF7] underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="sm:col-span-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={
                  !agreed ||
                  isSubmitting ||
                  !name.trim() ||
                  !email.trim() ||
                  !phone.trim() ||
                  !preferedLocation.trim()
                }
                className={`px-4 py-2 rounded-lg font-medium transition ${agreed && !isSubmitting && name.trim() && email.trim() && phone.trim() && preferedLocation.trim() ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white" : "bg-gray-400 cursor-not-allowed text-gray-200"}`}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </div>
      </section>
      <section className="bg-gray-300 dark:bg-black/30">
        <Footer />
      </section>
    </div>
  );
}

export default PropertySearchSection;
