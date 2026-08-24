import CustomDropdown from "./CustomDropdown";
import { FiMapPin } from "react-icons/fi";

const MAX_BEDROOM_STEP = 7;

interface PropertyFiltersModalProps {
  mode: "general" | "student";
  isOpen: boolean;
  onClose: () => void;
  clearAllFilters: () => void;
  totalProperties: number;

  // Category filters
  category: string;
  setCategory: (val: string) => void;

  // Location/Area filters
  location: string;
  setLocation: (val: string) => void;
  area?: string;
  setArea?: (val: string) => void;

  // General specific price and rooms
  minPriceInput?: string;
  setMinPriceInput?: (val: string) => void;
  maxPriceInput?: string;
  setMaxPriceInput?: (val: string) => void;
  bedroomCount?: number;
  setBedroomCount?: (val: number) => void;
  sharedRoomOnly?: boolean;
  setSharedRoomOnly?: (val: boolean) => void;

  // Student specific price and rooms
  selectedUniversity?: string;
  setUniversity?: (val: string) => void;
  bedrooms?: string;
  setBedrooms?: (val: string) => void;
  selectedPriceLabel?: string;
  setSelectedPriceLabel?: (val: string) => void;
  setPriceRange?: (val: [number, number]) => void;

  // Data Options
  categories?: { label: string; value: string }[];
  locationOptions?: { label: string; value: string }[];
  areaOptions?: { label: string; value: string }[];
  universityOptions?: { label: string; value: string }[];
}

export default function PropertyFiltersModal({
  mode,
  isOpen,
  onClose,
  clearAllFilters,
  totalProperties,
  category,
  setCategory,
  location,
  setLocation,
  area = "",
  setArea,
  minPriceInput = "",
  setMinPriceInput,
  maxPriceInput = "",
  setMaxPriceInput,
  bedroomCount = 0,
  setBedroomCount,
  sharedRoomOnly = false,
  setSharedRoomOnly,
  selectedUniversity = "",
  setUniversity,
  bedrooms = "",
  setBedrooms,
  selectedPriceLabel = "",
  setSelectedPriceLabel,
  setPriceRange,
  categories = [],
  locationOptions = [],
  areaOptions = [],
  universityOptions = [],
}: PropertyFiltersModalProps) {
  // Budget presets for student accommodation
  const studentPriceOptions = [
    { label: "Below ₦150k", range: [0, 150000] },
    { label: "₦150k - ₦250k", range: [150000, 250000] },
    { label: "₦250k - ₦350k", range: [250000, 350000] },
    { label: "₦350k - ₦500k", range: [350000, 500000] },
    { label: "Above ₦500k", range: [500000, 999999999] },
  ];

  // Category presets for student accommodation if not provided
  const studentCategoryOptions = [
    { label: "Self Contain", value: "Self Contain" },
    { label: "Single Room", value: "Single Room" },
    { label: "Mini Flat", value: "Mini Flat" },
    { label: "Shared Room", value: "Shared Room" },
    { label: "Flat", value: "Flat" },
  ];

  // Bedrooms presets for student accommodation
  const studentBedroomOptions = [
    { label: "1 Room", value: "1" },
    { label: "2 Rooms", value: "2" },
    { label: "3 Rooms", value: "3" },
    { label: "Shared", value: "shared" },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* panel */}
      <div
        className={`relative w-full sm:w-[540px] max-h-[90vh] sm:max-h-[85vh] bg-white dark:bg-[#1A1A1A] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ease-out transform ${
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-full md:translate-y-10 opacity-0 scale-95"
        }`}
      >
        {/* header */}
        <div className="flex items-center justify-center relative px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-white font-semibold text-base">Filters</h2>
          <button
            onClick={onClose}
            className="absolute right-4 text-gray-900 dark:text-white hover:opacity-60 text-xl leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* body — scrollable */}
        <div className="overflow-y-auto px-6 py-5">
          {mode === "general" ? (
            /* ==================== GENERAL PROPERTIES FILTERS ==================== */
            <>
              {/* Type of place */}
              <div className="pb-6">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Category of Property</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setCategory("")}
                    className={`px-4 py-3 rounded-full border text-sm font-medium transition cursor-pointer ${
                      category === ""
                        ? "border-black dark:border-white border-2 text-gray-900 dark:text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                    }`}
                  >
                    Any
                  </button>
                  {categories
                    .filter((opt) => opt.value !== "")
                    .map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setCategory(opt.value)}
                        className={`px-4 py-3 rounded-full border text-sm font-medium transition cursor-pointer ${
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

              {/* Location */}
              <div className="py-6">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Location</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <CustomDropdown
                      icon={<FiMapPin />}
                      placeholder="Location"
                      value={location}
                      options={locationOptions}
                      onChange={(value) => {
                        setLocation(value);
                        if (setArea) setArea("");
                      }}
                    />
                  </div>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <CustomDropdown
                      icon={<FiMapPin />}
                      placeholder={location ? "Area" : "Choose Location First"}
                      value={area}
                      options={areaOptions}
                      disabled={!location}
                      onChange={(value) => {
                        if (setArea) setArea(value);
                      }}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Price range */}
              <div className="py-6">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-1">Price range</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Enter a minimum and/or maximum price (₦)</p>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-gray-500 dark:text-gray-400 text-xs block mb-1">Minimum</label>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-full px-4 py-3 flex items-center gap-1">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">₦</span>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="0"
                        value={minPriceInput}
                        onChange={(e) => setMinPriceInput?.(e.target.value)}
                        className="w-full bg-transparent outline-none text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  <span className="text-gray-400 dark:text-gray-500 mt-5">—</span>

                  <div className="flex-1">
                    <label className="text-gray-500 dark:text-gray-400 text-xs block mb-1">Maximum</label>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-full px-4 py-3 flex items-center gap-1">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">₦</span>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="No max"
                        value={maxPriceInput}
                        onChange={(e) => setMaxPriceInput?.(e.target.value)}
                        className="w-full bg-transparent outline-none text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Rooms and beds */}
              <div className="pt-6">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Rooms and beds</h3>

                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-900 dark:text-white text-sm">Bedrooms</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setBedroomCount?.(Math.max(0, bedroomCount - 1))}
                      disabled={bedroomCount === 0}
                      className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white cursor-pointer"
                    >
                      –
                    </button>
                    <span className="text-gray-900 dark:text-white text-sm w-14 text-center">
                      {bedroomCount === 0
                        ? "Any"
                        : bedroomCount >= MAX_BEDROOM_STEP
                        ? `${MAX_BEDROOM_STEP}+`
                        : bedroomCount}
                    </span>
                    <button
                      onClick={() => setBedroomCount?.(Math.min(MAX_BEDROOM_STEP, bedroomCount + 1))}
                      disabled={bedroomCount === MAX_BEDROOM_STEP}
                      className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-900 dark:text-white text-sm">Shared room only</span>
                  <button
                    onClick={() => setSharedRoomOnly?.(!sharedRoomOnly)}
                    className={`w-11 h-6 rounded-full flex items-center transition px-0.5 cursor-pointer ${
                      sharedRoomOnly ? "bg-[#703BF7] justify-end" : "bg-gray-300 dark:bg-gray-600 justify-start"
                    }`}
                  >
                    <span className="w-5 h-5 bg-white rounded-full shadow" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ==================== STUDENT PROPERTIES FILTERS ==================== */
            <>
              {/* University & Area */}
              <div className="pb-6">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">University</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <CustomDropdown
                      icon={<FiMapPin />}
                      placeholder="University"
                      value={selectedUniversity}
                      options={universityOptions}
                      onChange={(value) => {
                        setUniversity?.(value);
                        setLocation("");
                      }}
                    />
                  </div>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
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
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Category of Property</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setCategory("")}
                    className={`px-4 py-3 rounded-full border text-sm font-medium transition cursor-pointer ${
                      category === ""
                        ? "border-black dark:border-white border-2 text-gray-900 dark:text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                    }`}
                  >
                    Any
                  </button>
                  {studentCategoryOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCategory(opt.value)}
                      className={`px-4 py-3 rounded-full border text-sm font-medium transition cursor-pointer ${
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
                    onClick={() => setBedrooms?.("")}
                    className={`px-4 py-3 rounded-full border text-sm font-medium transition cursor-pointer ${
                      bedrooms === ""
                        ? "border-black dark:border-white border-2 text-gray-900 dark:text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                    }`}
                  >
                    Any
                  </button>
                  {studentBedroomOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setBedrooms?.(opt.value)}
                      className={`px-4 py-3 rounded-full border text-sm font-medium transition cursor-pointer ${
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
                      setSelectedPriceLabel?.("");
                      setPriceRange?.([0, 999999999]);
                    }}
                    className={`px-4 py-3 rounded-full border text-sm font-medium transition cursor-pointer ${
                      selectedPriceLabel === ""
                        ? "border-black dark:border-white border-2 text-gray-900 dark:text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                    }`}
                  >
                    Any
                  </button>
                  {studentPriceOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        setSelectedPriceLabel?.(opt.label);
                        setPriceRange?.(opt.range as [number, number]);
                      }}
                      className={`px-4 py-3 rounded-full border text-sm font-medium transition cursor-pointer ${
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
            </>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={clearAllFilters}
            className="text-gray-900 dark:text-white underline text-sm font-medium cursor-pointer"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className="bg-[#703BF7] hover:bg-[#5c2fe0] text-white px-5 py-3 rounded-full text-sm font-semibold cursor-pointer"
          >
            Show {totalProperties} {totalProperties === 1 ? "place" : "places"}
          </button>
        </div>
      </div>
    </div>
  );
}
