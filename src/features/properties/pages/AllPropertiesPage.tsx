import Navbar from "../../../shared/components/Layout/Navbar";
import { useEffect } from "react";
import { usePropertyStore } from "../store/usePropertyStore";
import type { Property } from "../../../types";
import PropertyCard from "../components/PropertyCard";
import Footer from "../../../shared/components/Layout/Footer";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

function AllProperties() {
  const { properties, loading, fetchProperties, apiPage, totalProperties } = usePropertyStore();

  useEffect(() => {
    fetchProperties(apiPage);
  }, [fetchProperties,apiPage]);

  const totalApiPages = Math.ceil(totalProperties / 30);

  const handleNextPage = () => {
    if (apiPage < totalApiPages) {
      fetchProperties(apiPage + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (apiPage > 1) {
      fetchProperties(apiPage - 1);
      window.scrollTo(0, 0);
    }
  };

  if (loading) return <p className="text-center text-white py-10">Loading properties...</p>;

  return (
    <div className="bg-gray-300 dark:bg-black/30 min-h-screen">
      <Navbar />
      <div className="w-[98%] mx-auto px-2 py-8 ">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">All Properties</h1>
        
        {properties.length === 0 ? (
          <p className="text-center text-gray-900 dark:text-white py-10">No properties found.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {properties.map((item: Property) => (
                <PropertyCard key={item.id} property={item} />
              ))}
            </div>

            <hr className="my-4 border-gray-600" />

            {/* Pagination Controls */}
            <div className="mt-10 flex justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 w-fit mx-auto">
              <div className="flex gap-4 justify-center items-center">
                <button
                  onClick={handlePrevPage}
                  disabled={apiPage === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-full disabled:opacity-30 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <FiArrowLeft size={20} />
                </button>
                 <p className="text-sm text-gray-600 dark:text-gray-400">
                    Page <span className="font-semibold text-gray-900 dark:text-white">{apiPage}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalApiPages || 1}</span>
                  </p>
                <button
                  onClick={handleNextPage}
                  disabled={apiPage >= totalApiPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-full disabled:opacity-30 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <FiArrowRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default AllProperties;
