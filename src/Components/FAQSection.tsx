import { useEffect, useState } from "react";
import { useFAQStore } from "../Store/useFAQStore"; 
import type { FAQ } from "../types";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { NavLink } from "react-router";

function FAQSection() {
  const { faq, loading, page, ITEMS_PER_PAGE, fetchFAQs, nextPage, prevPage } =
    useFAQStore();

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  if (loading) {
    return <p className="text-center text-white py-10">Loading FAQs...</p>;
  }

  const totalPages = Math.ceil(faq.length / ITEMS_PER_PAGE);

  const currentFAQs: FAQ[] = faq.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  function truncateWords(text: string, limit: number): string {
    const words = text.split(" ");
    return words.length <= limit
      ? text
      : words.slice(0, limit).join(" ");
  }

  return (
    <div className="w-[98%] mx-auto py-5 md:py-0">
      {/* Header */}
      <div className="">
        <img
          src="/logo/Abstract Design (1).png"
          alt="Icon"
          className="w-13 h-13 object-contain"
        />

        <div className="flex justify-between items-center mb-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold text-gray-900 dark:text-white">Frequently Asked Questions</h1>
            <p className="dark:text-gray-400 text-gray-600 w-[95%]">
              Find answers to common questions about RewaCity's services, property listings, and the real estate process. We're here to provide clarity and assist you every step of the way.
            </p>
          </div>

          <NavLink
            to="/AllFAQs"
            className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center w-[150px] hidden md:block"
          >
            View All
          </NavLink>
        </div>
      </div>

      {/* FAQ Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {currentFAQs.map((faq) => (
          <div
            key={faq.id}
            className="text-gray-900 dark:text-white bg-white/90 dark:bg-[#1A1A1A] border border-purple-100 dark:border-gray-600/30 rounded-xl p-5"
          >
            {/* Question */}
            <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>

            {/* Answer */}
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {expanded[faq.id]
                ? faq.answer
                : truncateWords(faq.answer,8)}
            </p>
             {faq.answer.split(" ").length > 8 && (
                <button
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [faq.id]: !prev[faq.id],
                    }))
                  }
                  className="text-[#703BF7] px-2  py-1 bg-black/30 border border-gray-600/30 rounded-md mt-4"
                >
                  {expanded[faq.id] ? "Show less" : " Read more"}
                </button>
              )}
          </div>
        ))}
      </div>

      <hr className="h-px bg-gray-600 border-0 w-full my-4" />

      {/* Pagination */}
      <div className="flex justify-between items-center gap-4 text-white">
        <p className="text-sm text-black dark:text-white">
          {page + 1} of {totalPages}
        </p>

        <NavLink
          to="/AllFAQs"
          className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center w-[120px] md:hidden"
        >
          View All
        </NavLink>

        <div className="flex gap-2">
          <button
            onClick={prevPage}
            className="px-2 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600"
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
  );
}

export default FAQSection;
