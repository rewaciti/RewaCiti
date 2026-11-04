import { useEffect, useState } from "react";
import Navbar from "../../shared/components/Layout/Navbar";
import PropertySection from "../../features/properties/components/PropertySection";
import FAQSection from "../../features/faq/components/FAQSection";
import Footer from "../../shared/components/Layout/Footer";
import { Link, useNavigate } from "react-router";
import { FiSearch, FiArrowRight } from "react-icons/fi";
import CommentSection from "../../features/comments/components/CommentSection";
import useScrollToHash from "../../shared/hooks/useScrollToHash";
import { Helmet } from "react-helmet-async";
import CustomDropdown from "../../features/properties/components/CustomDropdown";
import { usePropertyStore } from "../../features/properties/store/usePropertyStore";

// Same container as the Navbar, Footer and every inner page.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Same serif as the Navbar (load Fraunces once in index.html):
// <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&display=swap" rel="stylesheet">
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

type ListingTab = "all" | "rent" | "buy";

const TABS: { id: ListingTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rent", label: "Rent" },
  { id: "buy", label: "Buy" },
];

// Adjust to match the categories your listings actually use
const PROPERTY_TYPES = ["Apartment / Flat", "Self-contain", "Mini Flat", "Shared room", "Land"];

const FIELD_LABEL =
  "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";
const FIELD_INPUT =
  "w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none dark:text-white dark:placeholder:text-gray-500";

const services = [
  {
    img: "/logo/servicecontainer/Icon Container (3).png",
    text: "Property Discovery",
    description: "Find properties, rent, buy, sell and arrange property inspections.",
    to: "/properties",
  },
  {
    img: "/logo/servicecontainer/Icon Container (4).png",
    text: "Property Marketing & Valuation",
    description: "Professional valuation, marketing and negotiation to unlock property value.",
    to: "/Service#valuation",
  },
  {
    img: "/logo/servicecontainer/Icon Container (5).png",
    text: "Property Management",
    description: "Tenant support, property upkeep, rent and compliance handled for you.",
    to: "/Service#Management",
  },
  {
    img: "/logo/servicecontainer/Icon Container (6).png",
    text: "Real Estate Investment",
    description: "Market insight and strategy to build and grow a stronger portfolio.",
    to: "/Service#marketing",
  },
];

function Home() {
  useScrollToHash();
  const navigate = useNavigate();

  const [tab, setTab] = useState<ListingTab>("all");
  const [area, setArea] = useState("");
  const [areaOptions, setAreaOptions] = useState<{ label: string; value: string }[]>([]);
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    let active = true;

    void usePropertyStore.getState().fetchLocations().then((locations) => {
      if (!active) return;
      const uniqueAreas = Array.from(
        new Set(
          locations.flatMap(({ cities }) =>
            cities.flatMap(({ areas }) => areas.map(({ area: itemArea }) => itemArea)),
          ),
        ),
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        .map((itemArea) => ({ label: itemArea, value: itemArea }));
      setAreaOptions(uniqueAreas);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tab !== "all") params.set("listing", tab);
    if (area) params.set("area", area);
    if (type) params.set("category", type);
    if (budget) params.set("maxPrice", budget);
    const query = params.toString();
    navigate(`/Properties${query ? `?${query}` : ""}`);
  };

  return (
    <div className="bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
      <Helmet>
        <title>RewaCiti | Your Complete Real Estate Partner</title>
        <meta
          name="description"
          content="Explore real estate opportunities with RewaCiti. Discover, rent, buy, market and manage properties while accessing professional property services and investment opportunities."
        />
        <meta
          property="og:title"
          content="RewaCiti - Real Estate Beyond Properties"
        />
        <meta
          property="og:description"
          content="Connecting people, properties and opportunities through property discovery, transactions, management and real estate services."
        />
        <meta property="og:image" content="https://rewaciti.com/images/home-hero.jpg" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://rewaciti.com/" />
      </Helmet>
      <Navbar />

      {/* Hero: full-bleed photo, dark wash, headline + search card */}
      <section
        id="hero"
        className="relative z-20 flex min-h-[460px] items-end overflow-visible sm:min-h-[520px] lg:min-h-[580px]"
      >
        <img
          src="/images/home-hero.jpg"
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/35 to-black/65" />

        <div className={`${PAGE_CONTAINER} relative z-10 pb-8 pt-16 sm:pb-12`}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-200">
            RewaCiti — Your Real Estate Partner
          </p>
          <h1
            style={SERIF}
            className="max-w-3xl text-4xl font-semibold leading-[1.1] text-white sm:text-5xl lg:text-6xl"
          >
            Real Estate,{" "}
            <em className="font-medium text-[#B79BFF]">
              Beyond Properties.
            </em>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-gray-200">
            From property discovery and transactions to management, valuation and investment,
            RewaCiti connects you to opportunities and services across real estate.
          </p>

          <form
            onSubmit={handleSearch}
            className="relative z-30 mt-8 max-w-3xl rounded-3xl bg-white/90 p-3 shadow-xl backdrop-blur-md dark:bg-[#1A1A1A]/90 sm:p-4"
          >
            <div role="tablist" aria-label="Listing type" className="mb-3 flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`cursor-pointer rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    tab === t.id
                      ? "bg-[#703BF7] text-white"
                      : "text-gray-600 hover:bg-[#9677df] hover:text-white dark:text-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:gap-0">
              <div className="sm:pr-4">
                <span className={FIELD_LABEL}>Location</span>
                <CustomDropdown
                  placeholder="Any location"
                  value={area}
                  options={areaOptions}
                  onChange={setArea}
                  buttonClassName="h-5 w-full border-0 bg-transparent p-0 text-left text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div className="border-t border-gray-200 pt-3 dark:border-white/10 sm:border-l sm:border-t-0 sm:px-4 sm:pt-0">
                <span className={FIELD_LABEL}>Type</span>
                <CustomDropdown
                  placeholder="Any type"
                  value={type}
                  onChange={setType}
                  options={PROPERTY_TYPES.map((propertyType) => ({
                    label: propertyType,
                    value: propertyType,
                  }))}
                  buttonClassName="h-5 w-full border-0 bg-transparent p-0 text-left text-sm text-gray-900 dark:text-white"
                />
              </div>

              <label className="block border-t border-gray-200 pt-3 dark:border-white/10 sm:border-l sm:border-t-0 sm:px-4 sm:pt-0">
                <span className={FIELD_LABEL}>Budget (₦)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={budget ? Number(budget).toLocaleString() : ""}
                  onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
                  placeholder="Any budget"
                  className={FIELD_INPUT}
                />
              </label>

              <button
                type="submit"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#703BF7] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9677df] sm:ml-2"
              >
                <FiSearch size={16} /> Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* What we do */}
      <section id="features" className="scroll-mt-24 py-14 sm:py-20">
        <div className={PAGE_CONTAINER}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {services.map((item) => (
              <Link
                key={item.text}
                to={item.to}
                className="group flex flex-col rounded-3xl border border-gray-200 bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-[#1A1A1A]"
              >
                <img
                  src={item.img}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-12 w-12 object-contain"
                />
                <h3
                  style={SERIF}
                  className="mt-4 text-lg font-semibold leading-snug text-gray-900 dark:text-white"
                >
                  {item.text}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#703BF7] transition group-hover:gap-2.5 dark:text-[#b79bff]">
                  Learn more <FiArrowRight size={15} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="properties" className="scroll-mt-24 bg-gray-200 py-14 dark:bg-black/50 sm:py-20">
        <PropertySection />
      </section>

      <section id="testimonials" className="scroll-mt-24 py-14 sm:py-20">
        <CommentSection />
      </section>

      <section id="faq" className="scroll-mt-24 bg-gray-200 py-14 dark:bg-black/50 sm:py-20">
        <FAQSection />
      </section>

      <Footer />
    </div>
  );
}

export default Home;