import Navbar from "../../../shared/components/Layout/Navbar";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { usePropertyStore } from "../store/usePropertyStore";
import { propertiesAPI } from "../services/propertiesAPI";
import type { PropertyLocations } from "../../../types/realEstate";
import {
  FiArrowLeft,
  FiArrowRight,
  FiFilter,
  FiUsers,
  FiSliders,
  FiHome,
  FiSearch,
  FiGrid,
  FiMap,
} from "react-icons/fi";
import PropertyCard from "../components/PropertyCard";
import PropertyMap from "../components/PropertyMap";
import Footer from "../../../shared/components/Layout/Footer";
import useScrollToHash from "../../../shared/hooks/useScrollToHash";
import { PropertyCardSkeleton } from "../../../shared/components/ui/Skeletons";
import CustomDropdown from "../../../features/properties/components/CustomDropdown.tsx";
import PropertyFiltersModal from "../components/PropertyFiltersModal";

// Same container as the Navbar, Property Details, Account, Request, Service and Contact pages.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Same serif as the Navbar / Home hero (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

// Fallback Navbar height (h-16); the real height is measured below
const NAVBAR_FALLBACK_PX = 64;

const pillBase =
  "shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition";
const pillActive = "border-[#703BF7] bg-[#703BF7] text-white";
const pillIdle =
  "border-gray-300 bg-white text-gray-800 hover:border-[#703BF7] hover:text-[#703BF7] dark:border-white/15 dark:bg-[#101010] dark:text-gray-200";

const dropdownButtonClass =
  "flex h-10 w-full cursor-pointer items-center justify-between rounded-full border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-900 transition hover:border-[#703BF7] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#101010] dark:text-white";

const cardShell =
  "rounded-3xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1A1A1A]";

interface LocationHierarchyItem {
  state: string;
  city: string;
  area: string;
  university?: string;
}

/** One row per area, and per nearby university or landmark, under its state and city. */
const flattenLocations = (states: PropertyLocations["data"]): LocationHierarchyItem[] =>
  states.flatMap(({ state, cities }) =>
    cities.flatMap(({ city, areas, nearby }) => [
      ...areas.map(({ area }) => ({ state, city, area })),
      ...nearby.map(({ name }) => ({ state, city, area: "", university: name })),
      ...(areas.length || nearby.length ? [] : [{ state, city, area: "" }]),
    ]),
  );

const ViewToggle = ({
  viewMode,
  setViewMode,
}: {
  viewMode: "list" | "map";
  setViewMode: (mode: "list" | "map") => void;
}) => {
  const base =
    "flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition";
  const on = "bg-[#703BF7] text-white shadow-sm";
  const off = "text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white";
  return (
    <div className="flex shrink-0 select-none items-center gap-1 rounded-full border border-gray-300 bg-white p-1 dark:border-white/15 dark:bg-[#101010]">
      <button
        type="button"
        onClick={() => setViewMode("list")}
        aria-pressed={viewMode === "list"}
        className={`${base} ${viewMode === "list" ? on : off}`}
      >
        <FiGrid size={14} /> List
      </button>
      <button
        type="button"
        onClick={() => setViewMode("map")}
        aria-pressed={viewMode === "map"}
        className={`${base} ${viewMode === "map" ? on : off}`}
      >
        <FiMap size={14} /> Map
      </button>
    </div>
  );
};

const FilterPills = ({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <button
      type="button"
      onClick={() => onChange("")}
      className={`${pillBase} ${value === "" ? pillActive : pillIdle}`}
    >
      All
    </button>
    {options
      .filter((opt) => opt.value !== "")
      .map((opt) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`${pillBase} ${value === opt.value ? pillActive : pillIdle}`}
        >
          {opt.label}
        </button>
      ))}
  </div>
);

const roundButton =
  "cursor-pointer rounded-full border border-gray-300 bg-white p-2.5 text-gray-900 transition hover:border-[#703BF7] hover:text-[#703BF7] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:bg-[#101010] dark:text-white";

function PropertySearchSection() {
  useScrollToHash();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    properties,
    loading,
    error,
    filters,
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

  const [state, setState] = useState(() => searchParams.get("state") ?? "");
  const [city, setCity] = useState("");
  const [area, setArea] = useState(() => searchParams.get("area") ?? "");
  const [university, setUniversity] = useState("");
  const [category, setCategory] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [listingType, setListingType] = useState("");
  const [selectedPriceLabel, setSelectedPriceLabel] = useState("");

  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999999999]);

  const [bedroomCount, setBedroomCount] = useState(0);
  const [sharedRoomOnly, setSharedRoomOnly] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [listingTypes, setListingTypes] = useState<{ label: string; value: string }[]>([]);

  // Measures the sticky Navbar and this page's top bar so the bar and the map panel
  // sit exactly below them, whatever the screen size.
  const topBarRef = useRef<HTMLDivElement>(null);
  const [navHeight, setNavHeight] = useState(NAVBAR_FALLBACK_PX);
  const [topBarHeight, setTopBarHeight] = useState(64);
  const mapTopOffset = navHeight + topBarHeight;

  useLayoutEffect(() => {
    const measure = () => {
      const nav = document.querySelector<HTMLElement>("header.sticky");
      if (nav) setNavHeight(nav.offsetHeight);
      if (topBarRef.current) setTopBarHeight(topBarRef.current.offsetHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    const raf = requestAnimationFrame(measure);
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, []);

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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const [locationHierarchy, setLocationHierarchy] = useState<LocationHierarchyItem[]>([]);

  // Where there are listings, and the listing types in use, to filter by
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [filters, locations] = await Promise.all([
          propertiesAPI.filters(),
          usePropertyStore.getState().fetchLocations(),
        ]);

        setLocationHierarchy(flattenLocations(locations));
        setListingTypes(filters.purposes.map((p) => ({ label: p.label, value: p.value })));
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    };

    fetchFilterOptions();
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
    const min = minPriceInput.trim() === "" ? 0 : Math.max(0, Number(minPriceInput));
    const max = maxPriceInput.trim() === "" ? 999999999 : Math.max(0, Number(maxPriceInput));

    if (Number.isNaN(min) || Number.isNaN(max)) return;

    // A new array with the same values would search again
    setPriceRange((current) => (current[0] === min && current[1] === max ? current : [min, max]));
  }, [minPriceInput, maxPriceInput]);

  useEffect(() => {
    fetchProperties(1, {
      search: searchTerm || undefined,
      state: state || undefined,
      city: city || undefined,
      area: area || undefined,
      nearby: university || undefined,
      typeId: category || undefined,
      ...(bedrooms === "shared"
        ? { sharing: "shared_room" }
        : { bedrooms: bedrooms ? Number(bedrooms) : undefined }),
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 999999999 ? priceRange[1] : undefined,
      purpose: listingType || undefined,
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
  ]);

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

  // 1. Available States
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

    return Array.from(stateMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([_, val]) => ({ label: val, value: val }));
  }, [locationHierarchy]);

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

    return Array.from(cityMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([_, val]) => ({ label: val, value: val }));
  }, [state, locationHierarchy]);

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

    return Array.from(areaMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([_, val]) => ({ label: val, value: val }));
  }, [state, city, locationHierarchy]);

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

    return Array.from(uniMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([_, val]) => ({ label: val, value: val }));
  }, [state, locationHierarchy]);

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
        (i) => i.state.toLowerCase() === stateLower && i.city.toLowerCase() === cityLower,
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
        (i) => (i.university || "").toLowerCase() === selectedUniversity.toLowerCase(),
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

  const listingTypeOptions = [{ label: "Listing Type", value: "" }, ...listingTypes];

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

  const resultsLabel =
    !loading && !error
      ? `${totalProperties} ${totalProperties === 1 ? "property" : "properties"}`
      : "";

  return (
    <div className="bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
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

      {/* Sticky search + filter bar */}
      <div
        ref={topBarRef}
        id="Categories"
        style={{ top: navHeight }}
        className="sticky z-20 border-b border-gray-400 bg-gray-300 dark:border-neutral-800 dark:bg-[#1A1A1A]"
      >
        <div className={`${PAGE_CONTAINER} space-y-3 py-3`}>
          <div className="flex items-center gap-3">
            <div className="relative min-w-0 flex-1 lg:max-w-2xl">
              <FiSearch
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search for properties..."
                aria-label="Search for properties"
                className="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-[#703BF7] focus:ring-2 focus:ring-[#703BF7]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:border-[#703BF7] hover:text-[#703BF7] dark:border-white/15 dark:bg-[#101010] dark:text-white"
            >
              <FiFilter size={15} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#703BF7] text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Small screens: Listing Type pills + toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <FilterPills
              options={listingTypeOptions}
              value={listingType}
              onChange={setListingType}
            />
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>

          {/* sm to lg: Category pills + toggle */}
          <div className="hidden items-center gap-2 sm:flex lg:hidden">
            <FilterPills options={categoryOptions} value={category} onChange={setCategory} />
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>

          {/* Large screens: location dropdowns + toggle */}
          <div className="hidden items-center justify-between gap-3 overflow-visible lg:flex">
            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-visible">
              <div className="w-[215px] shrink-0">
                <CustomDropdown
                  placeholder="Landmark"
                  value={university}
                  options={[{ label: "All Landmarks", value: "" }, ...universityOptions]}
                  onChange={handleUniversityChange}
                  className="w-full"
                  buttonClassName={dropdownButtonClass}
                />
              </div>

              <div className="w-[165px] shrink-0">
                <CustomDropdown
                  placeholder="State"
                  value={state}
                  options={[{ label: "All States", value: "" }, ...stateOptions]}
                  onChange={handleStateChange}
                  className="w-full"
                  buttonClassName={dropdownButtonClass}
                />
              </div>

              <div className="w-[190px] shrink-0">
                <CustomDropdown
                  placeholder={state ? "City" : "Select State first"}
                  value={city}
                  options={[{ label: "All Cities", value: "" }, ...cityOptions]}
                  onChange={handleCityChange}
                  disabled={!state}
                  className="w-full"
                  buttonClassName={dropdownButtonClass}
                />
              </div>

              <div className="w-[190px] shrink-0">
                <CustomDropdown
                  placeholder={!state ? "Select State first" : !city ? "Select City first" : "Area"}
                  value={area}
                  options={[{ label: "All Areas", value: "" }, ...areaOptions]}
                  onChange={handleAreaChange}
                  disabled={!state || !city}
                  className="w-full"
                  buttonClassName={dropdownButtonClass}
                />
              </div>
            </div>

            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>
      </div>

      <div>
        <div className={`${PAGE_CONTAINER} pt-8`}>
          <section>
            {viewMode === "map" ? (
              loading ? (
                <div className="flex h-[600px] w-full animate-pulse items-center justify-center rounded-3xl bg-gray-200 text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
                  Loading interactive map...
                </div>
              ) : currentProperties.length === 0 ? (
                <div
                  className={`${cardShell} flex h-[600px] w-full flex-col items-center justify-center p-6 text-center`}
                >
                  <h3 style={SERIF} className="mb-2 text-2xl font-semibold">
                    No properties found on the map
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    Try adjusting your search or filters to see results.
                  </p>
                </div>
              ) : (
                <>
                  <style>{`
                    @keyframes propertyListShiftLeft { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
                    @keyframes propertyMapSlideInRight { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
                  `}</style>
                  <div className="flex flex-col items-start gap-6 lg:flex-row">
                    <div
                      className="hidden w-full lg:block lg:w-[42%]"
                      style={{ animation: "propertyListShiftLeft 0.35s ease-out" }}
                    >
                      <div className="mb-5">
                        <h1 style={SERIF} className="text-3xl font-semibold tracking-tight">
                          Discover a world of possibilities
                        </h1>
                        {resultsLabel && (
                          <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">
                            {resultsLabel}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {currentProperties.map((property) => (
                          <div
                            key={property.id}
                            id={`property-card-${property.id}`}
                            onMouseEnter={() => setHoveredPropertyId(property.id)}
                            onMouseLeave={() => setHoveredPropertyId(null)}
                            className={`rounded-xl transition ${hoveredPropertyId === property.id ? "ring-2 ring-[#703BF7]" : "ring-1 ring-transparent"}`}
                          >
                            <PropertyCard property={property} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Map panel: top/height driven by the measured offsets so it starts exactly below the bars and fills the rest of the viewport */}
                    <div
                      className="z-10 w-full overflow-hidden rounded-3xl lg:sticky lg:w-[58%]"
                      style={{
                        top: `${mapTopOffset + 16}px`,
                        height: `calc(100vh - ${mapTopOffset + 32}px)`,
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
                            ?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                      />
                    </div>
                  </div>
                </>
              )
            ) : (
              <div>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h1 style={SERIF} className="text-3xl font-semibold sm:text-4xl">
                      Discover available properties
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-gray-700 dark:text-gray-400">
                      Explore a curated selection of properties and find the perfect place to
                      live, rent, or invest in locations that fit your lifestyle.
                    </p>
                  </div>
                  {resultsLabel && (
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-300">
                      {resultsLabel}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6 xl:grid-cols-4">
                  {loading ? (
                    [...Array(8)].map((_, i) => <PropertyCardSkeleton key={i} />)
                  ) : error ? (
                    // Not "no results": the search didn't reach us, so changing filters won't help
                    <div
                      className={`${cardShell} col-span-full flex flex-col items-center justify-center space-y-4 py-12 text-center`}
                    >
                      <div className="space-y-1">
                        <p style={SERIF} className="text-xl font-semibold">
                          We couldn't load properties
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Check your internet connection and try again.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fetchProperties(apiPage, filters)}
                        className="cursor-pointer rounded-full bg-[#703BF7] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9677df] active:scale-95"
                      >
                        Try again
                      </button>
                    </div>
                  ) : currentProperties.length === 0 ? (
                    <div
                      className={`${cardShell} col-span-full flex flex-col items-center py-12 text-center`}
                    >
                      <h3 style={SERIF} className="mb-2 text-2xl font-semibold">
                        No properties found
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-400">
                        Try adjusting your search or filters.
                      </p>
                      <p className="mb-6 text-sm text-gray-700 dark:text-gray-400">
                        Make sure your connection is stable.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/request-property")}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#703BF7] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9677df]"
                      >
                        <FiSliders size={16} />
                        <span>Request a property</span>
                      </button>
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

          {/* Pagination */}
          <div className="mt-10 flex items-center justify-between border-t border-gray-400 pb-10 pt-6 dark:border-white/10">
            <p className="text-sm text-gray-800 dark:text-gray-300">
              Page {apiPage} of {totalApiPages}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={apiPage === 1}
                aria-label="Previous page"
                className={roundButton}
              >
                <FiArrowLeft size={18} />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={apiPage >= totalApiPages}
                aria-label="Next page"
                className={roundButton}
              >
                <FiArrowRight size={18} />
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

      {/* Tailored services */}
      <section
        id="AddedServices"
        className="scroll-mt-24 bg-gray-200 py-14 dark:bg-black/50 sm:py-20"
      >
        <div className={PAGE_CONTAINER}>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#703BF7] dark:text-[#b79bff]">
              More ways we can help
            </p>
            <h2 style={SERIF} className="mt-2 text-3xl font-semibold sm:text-4xl">
              Tailored services for you
            </h2>
            <p className="mt-4 leading-7 text-gray-700 dark:text-gray-400">
              Explore specialized solutions designed to meet your housing needs, from submitting
              custom preferences and co-renting to listing your properties.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {/* Card 1: Property Preference */}
            <div className={`${cardShell} flex flex-col justify-between gap-6 p-6 sm:p-7`}>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#703BF7]/10 text-[#703BF7] dark:text-[#b79bff]">
                  <FiSliders size={22} />
                </div>
                <h3 style={SERIF} className="mt-4 text-xl font-semibold">
                  Can't find what you want?
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-400">
                  Ready to take the first step toward your dream property? Fill out the
                  preference form, and our real estate experts will work to find your perfect
                  match.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/request-property")}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#703BF7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9677df] sm:w-fit"
              >
                <FiSliders size={16} />
                <span>Request a property</span>
              </button>
            </div>

            {/* Card 2: Looking to Co-Rent */}
            <div className={`${cardShell} flex flex-col justify-between gap-6 p-6 sm:p-7`}>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#703BF7]/10 text-[#703BF7] dark:text-[#b79bff]">
                  <FiUsers size={22} />
                </div>
                <h3 style={SERIF} className="mt-4 text-xl font-semibold">
                  Looking to co-rent?
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-400">
                  Want to split rent and share verified properties in your preferred area? Submit
                  your co-rent request and let us connect you with compatible co-tenants.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/co-rent")}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#703BF7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9677df] sm:w-fit"
              >
                <FiUsers size={16} />
                <span>Find co-rent partners</span>
              </button>
            </div>

            {/* Card 3: List Your Property */}
            <div
              className={`${cardShell} flex flex-col justify-between gap-6 p-6 sm:col-span-2 sm:p-7 lg:col-span-1`}
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#703BF7]/10 text-[#703BF7] dark:text-[#b79bff]">
                  <FiHome size={22} />
                </div>
                <h3 style={SERIF} className="mt-4 text-xl font-semibold">
                  Have a property to list?
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-400">
                  Are you a landlord, property owner, or agent? Reach thousands of verified
                  tenants, professionals, and buyers by listing your property on RewaCiti.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/list-property")}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#703BF7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9677df] sm:w-fit"
              >
                <FiHome size={16} />
                <span>Apply to list</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default PropertySearchSection;