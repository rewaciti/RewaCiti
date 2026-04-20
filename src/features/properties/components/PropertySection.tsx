import { useEffect, useState } from "react";
import { usePropertyStore } from "../store/usePropertyStore";
import type { Property } from "../../../types";
import { NavLink } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import PropertyCard from "./PropertyCard";

import { PropertyCardSkeleton } from "../../../shared/components/ui/Skeletons";

function PropertySection() {
  const {
    properties,
    loading,
    page,
    ITEMS_PER_PAGE,
    fetchProperties,
    nextPage,
    prevPage,
    apiPage,
    totalProperties,
  } = usePropertyStore();

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Pagination Calculations
  const totalApiPages = Math.ceil(totalProperties / 30);
  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);

  const currentProperties: Property[] = showAll
    ? properties
    : properties.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

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
   <div className="px-4 mx-auto py-5 md:py-0">
     <div className="">
          <img
              src="/logo/Abstract Design (1).png"
              alt="Icon"
              className="w-13 h-13 object-contain"
            />
          <div className="flex justify-between items-center mb-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-white">Featured Properties</h1>
          <p className="dark:text-gray-400 text-gray-600 w-full">
            Explore our handpicked selection of featured properties.
          </p>
        </div>

        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center hidden md:block"
        >
          {showAll ? "Show Less" : "View All"}
        </button>
      </div>  
       </div>
      <div className=" py-4">
        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))
          ) : (
            currentProperties.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))
          )}
        </div>

        <hr className="my-4 h-px bg-gray-600 border-0 w-full" />
  
        {/* Pagination */}
        <div className="flex justify-between items-center  text-white ">
          <p className="text-sm text-black dark:text-white">
            {showAll
              ? `Page ${apiPage} of ${totalApiPages || 1}`
              : `${page + 1} of ${totalPages || 1}`}
          </p>
          
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center w-[120px] md:hidden"
          >
            {showAll ? "Show Less" : "View All"}
          </button>

          <div className="flex gap-4">
            <button
              onClick={handlePrev}
              className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600 "
              disabled={showAll ? apiPage === 1 : page === 0}
            >
                <FiArrowLeft size={20} />
            </button>
    
            <button
              onClick={handleNext}
              className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600"
              disabled={showAll ? apiPage >= totalApiPages : page >= totalPages - 1}
            >
                <FiArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
   </div>
  );
}

export default PropertySection;