import { useEffect } from "react";
import { usePropertyStore } from "../store/usePropertyStore";
import PropertyCard from "./PropertyCard";
import { PropertyCardSkeleton } from "../../../shared/components/ui/Skeletons";
import { Link } from "react-router";

function PropertySection() {
  const {
    properties,
    loading,
    error,
    fetchProperties,
  } = usePropertyStore();

  useEffect(() => {
    fetchProperties(1);
  }, [fetchProperties]);

  const currentProperties = properties.slice(0, 3);

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
            <h1 className="text-4xl font-semibold text-gray-900 dark:text-white">
              Featured Properties
            </h1>
            <p className="dark:text-gray-400 text-gray-600 w-full">
              Explore our handpicked selection of featured properties.
            </p>
          </div>

          <Link
            to="/properties"
            className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center hidden md:block"
          >
            View All
          </Link>
        </div>
      </div>
      <div className=" py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {loading ? (
            [...Array(3)].map((_, i) => <PropertyCardSkeleton key={i} />)
          ) : error ? (
            <div className="col-span-1 md:col-span-3 py-10 flex flex-col items-center justify-center text-center space-y-4 bg-white dark:bg-[#1A1A1A] border border-red-100 dark:border-red-900/30 rounded-xl">
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-full">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Something went wrong
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {error}
                </p>
              </div>
              <button
                onClick={() => fetchProperties(1)}
                className="bg-[#703BF7] text-white px-6 py-2 rounded-lg hover:bg-[#5a2ed1] transition-all shadow-md active:scale-95"
              >
                Try Again
              </button>
            </div>
          ) : (
            currentProperties.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))
          )}
        </div>

        <hr className="my-4 h-px bg-gray-600/50 border-0 w-full" />
      </div>
    </div>
  );
}

export default PropertySection;