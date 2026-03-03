import Navbar from "../Components/Navbar";
import { useEffect, useState } from "react";
import { usePropertyStore } from "../Store/usePropertyStore.ts";
import type { Property } from "../types";
import {
  FiArrowLeft,
  FiArrowRight,
  FiMapPin,
  FiHome,
} from "react-icons/fi";
import { IoBedOutline } from "react-icons/io5";
import PropertyCard from "../Components/PropertyCard";
import Footer from "../Components/Footer.tsx";
import { FiFilter } from "react-icons/fi";
import useScrollToHash from "../hooks/useLocation";
import { NavLink } from "react-router";

function PropertySearchSection() {
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
  } = usePropertyStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [area, setArea] = useState("");

  const [preferedLocation, setPreferedLocation] = useState("");
  const [preferedType, setPreferedType] = useState("");
  const [Budget, setBudget] = useState("");

  // NEW: Price range controlled through dropdown
  const [selectedPriceLabel, setSelectedPriceLabel] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0, 999999999,
  ]);

  const [showFilters, setShowFilters] = useState(false);
  const [filtered, setFiltered] = useState<Property[]>([]);

  const priceOptions = [
    { label: "Any Price", range: [0, 999999999] },
    { label: "Below ₦100k", range: [0, 100000] },
    { label: "₦100k - ₦300k", range: [100000, 300000] },
    { label: "₦300k - ₦600k", range: [300000, 600000] },
    { label: "₦600k - ₦1M", range: [600000, 1000000] },
    { label: "Above ₦1M", range: [1000001, 999999999] },
  ];

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Filtering
  useEffect(() => {
    const results = properties.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation = location ? p.location.state === location : true;
      const matchesType = type ? p.type === type : true;
      const matchesBedrooms = bedrooms ? p.bedrooms === Number(bedrooms) : true;
      const matchesArea = area ? p.location.area === area : true;

      const priceNum = Number(String(p.price).replace(/[^0-9]/g, ""));
      const matchesPrice =
        priceNum >= priceRange[0] && priceNum <= priceRange[1];

      return (
        matchesSearch &&
        matchesLocation &&
        matchesType &&
        matchesBedrooms &&
        matchesArea &&
        matchesPrice
      );
    });

    setFiltered(results);
    setPage(0);
  }, [
    searchTerm,
    location,
    type,
    bedrooms,
    area,
    priceRange,
    properties,
    setPage,
  ]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentProperties = filtered.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE,
  );

  // Dropdown unique options
  const uniqueLocations = Array.from(
    new Set(
      properties.map(
        (p) => `${p.location.state}`,
      ),
    ),
  );
  const uniqueTypes = Array.from(new Set(properties.map((p) => p.type)));
  const uniqueBedrooms = Array.from(
    new Set(properties.map((p) => p.bedrooms)),
  ).sort((a, b) => a - b);
  const uniqueAreas = Array.from(
    new Set(
      properties
        .filter((p) => (location ? p.location.state === location : true))
        .map((p) => p.location.area),
    ),
  );

  if (loading) {
    return (
      <p className="text-center text-white py-10">Loading properties...</p>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="relative" id="Categories">
        <div className="bg-linear-to-r dark:from-neutral-600/20 from-gray-300/50 dark:to-black/60 to-gray-400 p-10  space-y-6 border-b border-gray-600">
          <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
            Find Your Dream Property
          </h1>

          <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
            Welcome to RewaCity, where your dream property awaits in every
            corner of our beautiful world. Explore our curated selection of
            properties, each offering a unique story and a chance to redefine
            your life. With categories to suit every dreamer, your journey
          </p>
          <NavLink
            to="/Studentarea"
            className="inline-block mt-3 bg-[#703BF7] hover:bg-[#5c2fe0] transition text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            🎓 Student Residence
          </NavLink>
        </div>
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] md:w-[80%]">
          <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-b-none flex">
            <input
              type="text"
              placeholder="Search For A Property"
              className="p-3 flex justify-center items-center dark:placeholder-gray-400 placeholder-gray-900/70 rounded-lg dark:bg-black/70 bg-gray-300 text-white focus:outline-none border border-gray-600/70 w-full rounded-b-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 dark:bg-black/70 bg-gray-300 text-white rounded-lg border border-gray-600 md:hidden"
            >
              <FiFilter />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-300 dark:bg-black/30">
        <div className="pt-8 w-[95%] mx-auto">
          {/* Filters Container */}
          <div
            className={`md:grid md:grid-cols-3 lg:grid-cols-5 md:gap-0 ${showFilters ? "block" : "hidden"}
                    md:block bg-neutral-900 md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 mb-6`}
          >
            {/* Location */}
            <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-tr-none">
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-400 text-gray-900 pointer-events-none" />

                <select
                  className="p-2 pl-10 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none border w-full border-gray-600/70 rounded-tr-none"
                  value={location}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocation(val === "__all__" ? "" : val);
                    setArea("");
                  }}
                >
                  <option value="" disabled hidden>
                    Location
                  </option>
                  <option value="__all__">All Locations</option>
                  {uniqueLocations.map((loc, idx) => (
                    <option key={idx} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Area */}
            <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-t-none">
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-400 text-gray-900 pointer-events-none" />

                <select
                  className="p-2 pl-10 rounded-lg dark:bg-black/70 bg-gray-300 dark:text-gray-400 text-gray-900 focus:outline-none border w-full border-gray-600/70 rounded-t-none"
                  value={area}
                  onChange={(e) => {
                    const val = e.target.value;
                    setArea(val === "__all__" ? "" : val);
                  }}
                  disabled={!location}
                >
                  <option value="" disabled hidden>
                    Area
                  </option>
                  <option value="__all__">All Areas</option>
                  {uniqueAreas.map((a, idx) => (
                    <option key={idx} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type */}
            <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-t-none">
              <div className="relative">
                <FiHome className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-400 text-gray-900 pointer-events-none" />

                <select
                  className="p-2 pl-10 rounded-lg dark:bg-black/70 bg-gray-300 dark:text-gray-400 text-gray-900 focus:outline-none border w-full border-gray-600/70 rounded-t-none"
                  value={type}
                  onChange={(e) => {
                    const val = e.target.value;
                    setType(val === "__all__" ? "" : val);
                  }}
                >
                  <option value="" disabled hidden>
                    Property Type
                  </option>
                  <option value="__all__">All Types</option>
                  {uniqueTypes.map((t, idx) => (
                    <option key={idx} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-t-none">
              <div className="relative">
                <IoBedOutline className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-400 text-gray-900 pointer-events-none" />

                <select
                  className="p-2 pl-10 rounded-lg dark:bg-black/70 bg-gray-300 dark:text-gray-400 text-gray-900 focus:outline-none border w-full border-gray-600/70 rounded-t-none"
                  value={bedrooms}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBedrooms(val === "__all__" ? "" : val);
                  }}
                >
                  <option value="" disabled hidden>
                    Number of Rooms
                  </option>
                  <option value="__all__">All Bedrooms</option>
                  {uniqueBedrooms.map((b, idx) => (
                    <option key={idx} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>


            {/* PRICE RANGE - SELECT */}
            <div className="border-7 dark:border-neutral-800/90 border-neutral-500/70 rounded-2xl bg-neutral-700/90 rounded-tl-none">
              <select
                className="p-2 rounded-lg dark:bg-black/70 bg-gray-300 dark:text-gray-400 text-gray-900 focus:outline-none border w-full border-gray-600/70 rounded-tl-none"
                value={selectedPriceLabel}
                onChange={(e) => {
                  const label = e.target.value;
                  setSelectedPriceLabel(label);
                  const opt = priceOptions.find((o) => o.label === label);
                  if (opt) setPriceRange(opt.range as [number, number]);
                }}
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
          </div>

          {/* Properties */}
          <div>
            <div className="flex-1 flex flex-col justify-center px-5 space-y-3 z-10 mb-6">
              <img
                src="/logo/Abstract Design (1).png"
                alt="Icon"
                className="w-13 h-13 object-contain"
              />

              <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
                Discover a World of Possibilities
              </h1>

              <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
                Our portfolio of properties is as diverse as your dreams.
                Explore the following categories to find the perfect property
                that resonates with your vision of home
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentProperties.length === 0 ? (
                <div className="col-span-full text-center py-10">
                  <h3 className="text-white text-xl font-semibold mb-2">
                    No properties found
                  </h3>
                  <p className="text-gray-400 text-sm">
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
          <div className="flex justify-between items-center text-white mt-6">
            <p className="text-sm text-black dark:text-white">
              {page + 1} of {totalPages}
            </p>

            <div className="flex gap-4">
              <button
                onClick={prevPage}
                disabled={page === 0}
                className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600"
              >
                <FiArrowLeft size={20} />
              </button>

              <button
                onClick={nextPage}
                disabled={page >= totalPages - 1}
                className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600"
              >
                <FiArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-gray-300 dark:bg-black/30 p-5 pb-20" id="Portfolio">
        <div className="  ">
          <div className="flex-1 flex flex-col justify-center px-5 space-y-3 z-10 mb-6">
            <img
              src="/logo/Abstract Design (1).png"
              alt="Icon"
              className="w-13 h-13 object-contain"
            />

            <h1 className="text-gray-900 dark:text-white md:text-4xl text-3xl">
              Let's Make it Happen
            </h1>

            <p className="text-gray-800 dark:text-gray-400 text-[14px] max-w-[95%]">
              Ready to take the first step toward your dream property? Fill out
              the form below, and our real estate wizards will work their magic
              to find your perfect match. Don't wait; let's embark on this
              exciting journey together.
            </p>
          </div>

          <form className="grid dark:bg-[#121212] bg-white  grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border border-gray-700/40 rounded-3xl p-6 md:p-10">
            {/* Name */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">Name</label>
              <input
                type="text"
                placeholder="Enter Full Name"
                className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">Email</label>
              <input
                type="email"
                placeholder="Enter your Email"
                className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">Phone</label>
              <input
                type="tel"
                placeholder="Enter Phone Number"
                className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            {/* Preferred Location */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">
                Preferred Location
              </label>
              <select
                className="p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 border w-full border-gray-600/70"
                value={preferedLocation}
                onChange={(e) => setPreferedLocation(e.target.value)}
              >
                <option value="" disabled hidden>
                  Select Location
                </option>
                {uniqueLocations.map((loc, idx) => (
                  <option key={idx} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">Property Type</label>
              <select
                className="p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 border w-full border-gray-600/70"
                value={preferedType}
                onChange={(e) => setPreferedType(e.target.value)}
              >
                <option value="" disabled hidden>
                  Property Type
                </option>
                {uniqueTypes.map((t, idx) => (
                  <option key={idx} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">No of Bedrooms</label>
              <input
                type="number"
                placeholder="Enter Number of Bedrooms"
                className="w-full mt-1 p-3 py-2.5 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm">Budget</label>
              <select
                className="p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 border w-full border-gray-600/70 "
                value={Budget}
                onChange={(e) => {
                  const label = e.target.value;
                  setBudget(label);
                  const opt = priceOptions.find((o) => o.label === label);
                  if (opt) setPriceRange(opt.range as [number, number]);
                }}
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
              <select className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70">
                <option hidden>Select Method</option>
                <option>Phone</option>
                <option>Email</option>
              </select>
            </div>

            {/* Message */}
            <div className="sm:col-span-2 lg:col-span-4 ">
              <label className="text-gray-700 dark:text-gray-300 text-sm">Message</label>
              <textarea
                placeholder="Enter your Message here.."
                rows={4}
                className="w-full mt-1 p-3 rounded-lg dark:bg-black/70 bg-gray-300 text-gray-900 dark:text-white border border-gray-600/70 focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 resize-none"
              />
            </div>

            {/* Agreement */}
            <div className="sm:col-span-2 flex items-center gap-3">
              <input type="checkbox" className="mt-0.5" />
              <p className="text-gray-900 dark:text-white text-sm">
                I agree with the{" "}
                <span className="text-gray-900 dark:text-white underline">Terms</span> and{" "}
                <span className="text-gray-900 dark:text-white underline">Policy</span>
              </p>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2 flex items-center justify-end">
              <button
                type="submit"
                className="bg-[#703BF7] hover:bg-[#5c2fe0] transition text-white px-4 py-3 rounded-lg font-medium"
              >
                Send Your Message
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
