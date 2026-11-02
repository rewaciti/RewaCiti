import { useEffect } from "react";
import { usePropertyStore } from "../store/usePropertyStore";
import PropertyCard from "./PropertyCard";
import { PropertyCardSkeleton } from "../../../shared/components/ui/Skeletons";
import { NavLink } from "react-router";
import { FiAlertCircle, FiArrowRight } from "react-icons/fi";

// Same container as the Navbar, Footer and every inner page.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Same serif as the Navbar (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

const viewAllClass =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#703BF7] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9677df]";

function PropertySection() {
  const { featuredProperties, featuredLoading, featuredError, fetchFeaturedProperties } =
    usePropertyStore();

  useEffect(() => {
    fetchFeaturedProperties();
  }, [fetchFeaturedProperties]);

  // fetch/slice the max count you'll ever show (4)
  const currentProperties = featuredProperties.slice(0, 4);

  // sm -> 4, md -> 3, lg -> 4 (only the 4th card needs to toggle)
  const hideOnMdOnly = "hidden sm:block md:hidden xl:block";

  return (
    <div className={PAGE_CONTAINER}>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#703BF7] dark:text-[#b79bff]">Featured</p>
          <h2
            style={SERIF}
            className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl"
          >
            Featured properties
          </h2>
          <p className="mt-3 text-gray-700 dark:text-gray-400">
            Explore our handpicked selection of featured properties.
          </p>
        </div>

        <NavLink to="/properties" className={`${viewAllClass} hidden sm:inline-flex`}>
          View all <FiArrowRight size={16} />
        </NavLink>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6 xl:grid-cols-4">
        {featuredLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className={`${i === 3 ? hideOnMdOnly : ""} h-full`}>
              <PropertyCardSkeleton />
            </div>
          ))
        ) : featuredError ? (
          <div className="col-span-full flex flex-col items-center justify-center space-y-4 rounded-3xl border border-gray-200 bg-white py-12 text-center dark:border-white/10 dark:bg-[#1A1A1A]">
            <div className="rounded-full bg-red-50 p-4 text-red-500 dark:bg-red-900/10">
              <FiAlertCircle size={28} />
            </div>
            <div className="space-y-1">
              <p style={SERIF} className="text-xl font-semibold text-gray-900 dark:text-white">
                Something went wrong
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{featuredError}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchFeaturedProperties()}
              className="cursor-pointer rounded-full bg-[#703BF7] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9677df] active:scale-95"
            >
              Try again
            </button>
          </div>
        ) : (
          currentProperties.map((item, i) => (
            <div key={item.id} className={`${i === 3 ? hideOnMdOnly : ""} h-full`}>
              <PropertyCard property={item} />
            </div>
          ))
        )}
      </div>

      <div className="mt-8 sm:hidden">
        <NavLink to="/properties" className={`${viewAllClass} w-full`}>
          View all <FiArrowRight size={16} />
        </NavLink>
      </div>
    </div>
  );
}

export default PropertySection;