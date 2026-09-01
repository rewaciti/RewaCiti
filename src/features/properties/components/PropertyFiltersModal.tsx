const MAX_BEDROOM_STEP = 7;

interface PropertyFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  clearAllFilters: () => void;
  totalProperties: number;

  // Category filters
  category?: string;
  setCategory?: (val: string) => void;

  // Listing type filter
  listingType?: string;
  setListingType?: (val: string) => void;

  // General specific price and rooms
  minPriceInput?: string;
  setMinPriceInput?: (val: string) => void;
  maxPriceInput?: string;
  setMaxPriceInput?: (val: string) => void;
  bedroomCount?: number;
  setBedroomCount?: (val: number) => void;
  sharedRoomOnly?: boolean;
  setSharedRoomOnly?: (val: boolean) => void;

  // Data Options
  categories?: { label: string; value: string }[];
  listingTypeOptions?: { label: string; value: string }[];
}

export default function PropertyFiltersModal({
  isOpen,
  onClose,
  clearAllFilters,
  totalProperties,
  category,
  setCategory,
  minPriceInput = "",
  setMinPriceInput,
  maxPriceInput = "",
  setMaxPriceInput,
  bedroomCount = 0,
  setBedroomCount,
  sharedRoomOnly = false,
  setSharedRoomOnly,
  listingType = "",
  setListingType,
  categories = [],
  listingTypeOptions = [],
}: PropertyFiltersModalProps) {
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
        <div className="flex-1 overflow-auto px-6 py-5">
              {/* Property type */}
              <div className="pb-6">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Property Type</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setCategory?.("")}
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
                        onClick={() => setCategory?.(opt.value)}
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

              {/* Listing Type */}
              <div className="py-6">
                <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Listing Type</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setListingType?.("")}
                    className={`px-4 py-3 rounded-full border text-sm font-medium transition cursor-pointer ${
                      listingType === ""
                        ? "border-black dark:border-white border-2 text-gray-900 dark:text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                    }`}
                  >
                    Any
                  </button>
                  {listingTypeOptions
                    .filter((opt) => opt.value !== "")
                    .map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setListingType?.(opt.value)}
                        className={`px-4 py-3 rounded-full border text-sm font-medium transition cursor-pointer ${
                          listingType === opt.value
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