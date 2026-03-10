import { useEffect } from "react";
import { usePropertyStore } from "../Store/usePropertyStore.ts";
import type { Property } from "../types";
import { NavLink } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import PropertyCard from "../Components/PropertyCard";

function PropertySection() {
  const {properties,loading,page,ITEMS_PER_PAGE,fetchProperties,nextPage,prevPage,} = usePropertyStore();

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Loading State
  if (loading) {
    return <p className="text-center text-white py-10">Loading properties...</p>;
  }

  // Pagination Calculations
  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);

  const currentProperties: Property[] = properties.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  return (
   <div className="w-[98%] mx-auto py-10 md:py-4">
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

        <NavLink
          to="/AllProperties"
          className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center hidden md:block"
        >
          View All
        </NavLink>
      </div>  
       </div>
      <div className=" py-4">
        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {currentProperties.map((item) => (
            <PropertyCard key={item.id} property={item} />
        ))}
        </div>

        <hr className="my-4 h-px bg-gray-600 border-0 w-full" />
  
        {/* Pagination */}
        <div className="flex justify-between items-center  text-white ">
          <p className="text-sm text-black dark:text-white">
            {page + 1} of {totalPages}
          </p>
          <NavLink
            to="/AllProperties"
            className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center w-[120px] md:hidden"
          >
            View All
          </NavLink>

          <div className="flex gap-4">
            <button
              onClick={prevPage}
              className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600 "
              disabled={page === 0}
            >
                <FiArrowLeft size={20} />
            </button>
    
            <button
              onClick={nextPage}
              className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600"
              disabled={page >= totalPages - 1}
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
