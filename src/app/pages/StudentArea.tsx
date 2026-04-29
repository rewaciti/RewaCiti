import Navbar from "../../shared/components/Layout/Navbar";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { usePropertyStore } from "../../features/properties/store/usePropertyStore";
import { useAreaMapStore } from "../../features/map/store/useAreaMapStore";
import type { Property } from "../../types";
import {FiArrowLeft,FiArrowRight,FiMapPin,FiHome} from "react-icons/fi";
import { IoBedOutline } from "react-icons/io5";
import PropertyCard from "../../features/properties/components/PropertyCard";
import Footer from "../../shared/components/Layout/Footer";
import { FiFilter } from "react-icons/fi";
import useScrollToHash from "../../shared/hooks/useScrollToHash";
import { Link, NavLink } from "react-router";
import { toast } from "sonner";

import { PropertyCardSkeleton } from "../../shared/components/ui/Skeletons";

function Studentarea() {
  useScrollToHash();
  const {
    properties,
    loading,
    page,
    ITEMS_PER_PAGE,
    fetchProperties,
    nextPage,
    prevPage,
    setPage,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyId: "69b4712ce95a2df514b1c789",
      pipelineId: "69b49c7541d35d158e336621",
      title: `Student Inquiry from ${name}`,
      name: name,
      email: email,
      phone: phone,
      address: preferedLocation,
      note: message,
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
      toast.success("Message sent successfully!");
      // Reset form
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
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Price range controlled through dropdown
  const [selectedPriceLabel, setSelectedPriceLabel] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0, 999999999,
  ]);

  const [showFilters, setShowFilters] = useState(false);
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const priceOptions = [
    { label: "Budget", range: [0, 999999999] },
    { label: "Below ₦150k", range: [0, 150000] },
    { label: "₦150k - ₦250k", range: [150000, 250000] },
    { label: "₦250k - ₦350k", range: [250000, 350000] },
    { label: "₦350k - ₦500k", range: [350000, 500000] },
    { label: "Above ₦500k", range: [500000, 999999999] },
  ];

  useEffect(() => {
    fetchProperties();
    fetchAreaMaps();
  }, [fetchProperties, fetchAreaMaps]);

  // Filter areaMaps to only include universities and areas that have properties
  const availableUniversities = useMemo(() => {
    return areaMaps
      .filter((u) => u.areas.some((area) => properties.some((p) => p.location.area === area)))
      .map((u) => ({
        ...u,
        areas: u.areas.filter((area) => properties.some((p) => p.location.area === area)),
      }));
  }, [areaMaps, properties]);

  // Filtering
  useEffect(() => {
    const results = properties.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.state.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUniversity = selectedUniversity
        ? availableUniversities
            .find((u) => u.id === selectedUniversity)
            ?.areas.includes(p.location.area)
        : true;

      const matchesLocation = location ? p.location.area === location : true;

      const matchesType = category ? p.category === category : true;
      const matchesBedrooms = bedrooms ? p.bedrooms === Number(bedrooms) : true;

      const priceNum = Number(String(p.pricing.TotalCost).replace(/[^0-9]/g, ""));
      const matchesPrice = priceNum >= priceRange[0] && priceNum <= priceRange[1];

      return (
        matchesSearch &&
        matchesUniversity &&
        matchesLocation &&
        matchesType &&
        matchesBedrooms &&
        matchesPrice
      );
    });

    setFiltered(results);
    setPage(0);
  }, [
    searchTerm,
    location,
    category,
    bedrooms,
    priceRange,
    properties,
    setPage,
    availableUniversities,
    selectedUniversity,
  ]);

  // Pagination
  const totalApiPages = Math.ceil(totalProperties / 30);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentProperties = showAll 
    ? filtered 
    : filtered.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  const handleNext = () => {
    if (showAll) {
      if (apiPage < totalApiPages) fetchProperties(apiPage + 1);
    } else {
      nextPage();
    }
  };

  const handlePrev = () => {
    if (showAll) {
      if (apiPage > 1) fetchProperties(apiPage - 1);
    } else {
      prevPage();
    }
  };

  return (
    <div>
      <Navbar />
      <div className="relative" id="Categories">
        <div className="bg-linear-to-r dark:from-neutral-600/20 from-gray-300/50 dark:to-black/60 to-gray-400 p-5 py-10 space-y-6 border-b border-gray-600">
          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
            Find Student Accomodation
          </h1>

          <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
            Welcome to RewaCiti, where your dream property awaits in every
            corner of our beautiful world. Explore our curated selection of
            properties, each offering a unique story and a chance to redefine
            your life. With categories to suit every dreamer, your journey
          </p>
          <NavLink
            to="/Properties"
            className="inline-block mt-3 bg-[#703BF7] hover:bg-[#5c2fe0] transition text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            🏠General Residence
          </NavLink>
        </div>
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] md:w-[80%]">
          <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-b-none flex">
            <input
              type="text"
              placeholder="Search For A Property"
              className="p-3 flex justify-center items-center dark:placeholder-gray-400 placeholder-gray-900/70 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none border border-gray-600/70 w-full rounded-b-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white rounded-lg border border-gray-600 md:hidden"
            >
              <FiFilter />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-300 dark:bg-black/30 px-4">
        <div className="pt-8 mx-auto">
          {/* Filters Container */}
          <div
            className={`md:grid md:grid-cols-5 
                      ${showFilters ? "block" : "hidden"} md:block md:bg-transparent rounded-2xl md:rounded-none md:p-0 mb-6`}
          >
            {/* University (select) */}
            <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-tr-none">
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-400 text-gray-900 pointer-events-none" />

                <select
                  className="p-2 pl-10 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none border w-full border-gray-600/70 rounded-tr-none"
                  value={selectedUniversity}
                  onChange={(e) => {
                    const val = e.target.value;
                    const v = val === "__all__" ? "" : val;
                    setUniversity(v);
                    setLocation("");
                  }}
                >
                  <option value="" disabled hidden>
                    University
                  </option>
                  <option value="__all__">All Universities</option>
                  {availableUniversities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Area (populated from selected university) */}
            <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-t-none">
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-400 text-gray-900 pointer-events-none" />

                <select
                  className="p-2 pl-10 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none border w-full border-gray-600/70 rounded-t-none"
                  value={location}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocation(val === "__all__" ? "" : val);
                  }}
                  disabled={!selectedUniversity}
                >
                  <option value="" disabled hidden>
                    Area
                  </option>
                  <option value="__all__">All Areas</option>
                  {availableUniversities
                    .find((u) => u.id === selectedUniversity)
                    ?.areas.map((a, idx) => (
                      <option key={idx} value={a}>
                        {a}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Category */}
            <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-t-none">
              <div className="relative">
                <FiHome className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-400 text-gray-900 pointer-events-none" />

                <select
                  className="p-2 pl-10 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none border w-full border-gray-600/70 rounded-t-none"
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategory(val === "__all__" ? "" : val);
                  }}
                >
                  <option value="" disabled hidden>
                    Category
                  </option>
                  <option value="__all__">All Categories</option>
                  <option value="Self Contain">Self Contain</option>
                  <option value="Single Room">Single Room</option>
                  <option value="Mini Flat">Mini Flat</option>
                  <option value="Shared Room">Shared Room</option>
                  <option value="Flat">Flat</option>

                </select>
              </div>
            </div>

            <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-t-none">
              <div className="relative">
                <IoBedOutline className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-400 text-gray-900 pointer-events-none" />

                <select
                  className="p-2 pl-10 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none border w-full border-gray-600/70 rounded-t-none"
                  value={bedrooms}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBedrooms(val === "__all__" ? "" : val);
                  }}
                >
                  <option value="" disabled hidden>
                    Rooms
                  </option>
                  <option value="__all__">Any</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="shared">shared</option>
                </select>
              </div>
            </div>

            {/* PRICE RANGE - SELECT */}
            <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-tl-none">
              <select
                className="p-2 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none border w-full border-gray-600/70 rounded-tl-none"
                value={selectedPriceLabel}
                onChange={(e) => {
                  const label = e.target.value;
                  setSelectedPriceLabel(label);
                  const opt = priceOptions.find((o) => o.label === label);
                  if (opt) setPriceRange(opt.range as [number, number]);
                }}
              >
                <option value="" disabled hidden>
                  Budget
                </option>
                {priceOptions.map((opt, idx) => (
                  <option key={idx} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Properties */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 flex flex-col justify-center space-y-3 z-10">
                <img
                  src="/logo/Abstract Design (1).png"
                  alt="Icon"
                  className="w-13 h-13 object-contain"
                />

                <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
                  Discover a World of Possibilities
                </h1>

               <div className="flex justify-between items-center">
                  <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
                    Our portfolio of properties is as diverse as your dreams.
                    Explore the following categories to find the perfect property
                    that resonates with your vision of home
                  </p>
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center hidden md:block shrink-0"
                  >
                    {showAll ? "Show Less" : "View All"}
                  </button>
               </div>

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {loading || areaLoading ? (
                [...Array(3)].map((_, i) => <PropertyCardSkeleton key={i} />)
              ) : currentProperties.length === 0 ? (
                <div className="col-span-full text-center py-10">
                  <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-2">
                    No properties found
                  </h3>
                  <p className="text-gray-800 dark:text-gray-400 text-sm">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                currentProperties.map((item) => (
                  <PropertyCard key={item.id} property={item} />
                ))
              )}
            </div>
          </div>

          <hr className="my-4 border-gray-600" />

          {/* Pagination */}
          <div className="flex justify-between items-center text-white">
            <p className="text-sm text-black dark:text-white">
              {showAll 
                ? `Page ${apiPage} of ${totalApiPages || 1}` 
                : `${page + 1} of ${totalPages || 1}`}
            </p>

            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center w-[120px] md:hidden"
            >
              {showAll ? "View Less" : "View All"}
            </button>

            <div className="flex gap-4">
              <button
                onClick={handlePrev}
                disabled={showAll ? apiPage === 1 : page === 0}
                className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600"
              >
                <FiArrowLeft size={20} />
              </button>

              <button
                onClick={handleNext}
                disabled={showAll ? apiPage >= totalApiPages : page >= totalPages - 1}
                className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600"
              >
                <FiArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-gray-300 dark:bg-black/30 py-2 px-4 pb-20" id="Portfolio">
        <div className="  ">
          <div className="flex-1 flex flex-col justify-center space-y-3 z-10 mb-6">
            <img
              src="/logo/Abstract Design (1).png"
              alt="Icon"
              className="w-13 h-13 object-contain"
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
            className="grid dark:bg-[#1A1A1A] bg-white grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border border-gray-700/40 rounded-3xl p-6 md:p-10"
          >
            {/* Name */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">Name</label>
              <input
                type="text"
                placeholder="Enter Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">Email</label>
              <input
                type="email"
                placeholder="Enter your Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">Phone</label>
              <input
                type="tel"
                placeholder="Enter Phone Number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            {/* Preferred Location */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">Preferred Location</label>
              <input
                type="text"
                placeholder="Enter Prefered Location"
                required
                value={preferedLocation}
                onChange={(e) => setPreferedLocation(e.target.value)}
                className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">Category</label>
              <select
                required
                className="p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none border w-full border-gray-600/70"
                value={preferedCategory}
                onChange={(e) => setPreferedCategory(e.target.value)}
              >
                <option value="" disabled hidden>
                  Category
                </option>
                 <option value="Self Contain">Self Contain</option>
                  <option value="Studio Apartment">Studio Apartment</option>
                  <option value="Mini Flat">Mini Flat</option>
                  <option value="Flat">Flat</option>
                  <option value="Bungalow">Bungalow</option>
                  <option value="Duplex">Duplex</option>
                  <option value="Mansion">Mansion</option>
                  <option value="Villa">Villa</option>
                  <option value="Smart Home">Smart Home</option>
                  <option value="Single Room (Shared)">Single Room</option>
                  <option value="Shared Room">Shared Room</option>
                  <option value="Furnished Apartment">Furnished Apartment</option>
                  <option value="Hostel">Hostel</option>

                  {/* Land */}
                  <option value="Land">Land</option>

                  {/* Special */}
                  <option value="Mixed-Use Property">Mixed-Use Property</option>
                  <option value="Uncompleted Building">Uncompleted Building</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">No of Bedrooms</label>
              <input
                type="number||text"
                placeholder="Enter Number of Bedrooms"
                required
                min={1}
                value={bedroomsContact}
                onChange={(e) => setBedroomsContact(e.target.value)}
                className="w-full mt-1 p-3 py-2.5 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">Budget</label>
              <select
                required
                className="p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none border w-full border-gray-600/70"
                value={Budget}
                onChange={(e) => setBudget(e.target.value)}
              >
                <option value="" disabled hidden>
                  Price Range
                </option>
                {priceOptions.map((opt, idx) => (
                  <option key={idx} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Contact */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">
                Preferred Contact Method
              </label>
              <select
                required
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value)}
                className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none"
              >
                <option value="" hidden>
                  Select Method
                </option>
                <option>Phone</option>
                <option>Email</option>
              </select>
            </div>

            {/* Message */}
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="text-gray-700 dark:text-gray-300 text-sm">
                Describe What You Want
              </label>
              <textarea
                placeholder="Enter your Description here.."
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 resize-none"
              />
            </div>

            {/* Agreement */}
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <p className="text-gray-900 dark:text-white text-sm">
                I agree with the{" "}
                <Link
                  to="/terms"
                  className="hover:text-[#703BF7] text-gray-900 dark:text-white text-sm underline dark:hover:text-[#703BF7]"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  className="hover:text-[#703BF7] text-gray-900 dark:text-white text-sm underline dark:hover:text-[#703BF7]"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={!agreed || isSubmitting}
                className={`px-4 py-3 rounded-lg font-medium transition
                  ${
                    agreed && !isSubmitting
                      ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white"
                      : "bg-gray-400 cursor-not-allowed text-gray-200"
                  }`}
              >
                {isSubmitting ? "Sending..." : "Send Your Message"}
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

export default Studentarea;
