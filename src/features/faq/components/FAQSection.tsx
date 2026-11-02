import { useEffect, useState } from "react";
import { useFAQStore } from "../store/useFAQStore";
import type { FAQ } from "../../../types";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { NavLink } from "react-router";

import { FAQCardSkeleton } from "../../../shared/components/ui/Skeletons";

// Same container as the Navbar, Footer and every inner page.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Same serif as the Navbar (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

const viewAllClass =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#703BF7] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9677df]";
const roundButton =
  "cursor-pointer rounded-full border border-gray-300 bg-white p-2.5 text-gray-900 transition hover:border-[#703BF7] hover:text-[#703BF7] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:bg-[#101010] dark:text-white";

function FAQSection() {
  const { faq, loading, page, ITEMS_PER_PAGE, fetchFAQs, nextPage, prevPage } = useFAQStore();

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const totalPages = Math.ceil(faq.length / ITEMS_PER_PAGE);

  const currentFAQs: FAQ[] = faq.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE,
  );

  function truncateWords(text: string, limit: number): string {
    const words = text.split(" ");
    return words.length <= limit ? text : words.slice(0, limit).join(" ");
  }

  return (
    <div className={PAGE_CONTAINER}>
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#703BF7] dark:text-[#b79bff]">Help</p>
          <h2
            style={SERIF}
            className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-3 text-gray-700 dark:text-gray-400">
            Find answers to common questions about RewaCiti's services, property listings, and the
            real estate process. We're here to provide clarity and assist you every step of the
            way.
          </p>
        </div>

        <NavLink to="/AllFAQs" className={`${viewAllClass} hidden md:inline-flex`}>
          View all <FiArrowRight size={16} />
        </NavLink>
      </div>

      {/* FAQ cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        {loading
          ? [...Array(3)].map((_, i) => <FAQCardSkeleton key={i} />)
          : currentFAQs.map((item) => {
              const isLong = item.answer.split(" ").length > 8;
              return (
                <article
                  key={item.id}
                  className="flex flex-col rounded-3xl border border-gray-200 bg-white p-6 text-gray-900 dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white"
                >
                  <h3 style={SERIF} className="mb-2 text-lg font-semibold">
                    {item.question}
                  </h3>

                  <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                    {expanded[item.id] ? item.answer : truncateWords(item.answer, 8)}
                    {!expanded[item.id] && isLong && "…"}
                  </p>

                  {isLong && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id],
                        }))
                      }
                      className="mt-4 w-fit cursor-pointer text-sm font-semibold text-[#703BF7] hover:underline dark:text-[#b79bff]"
                    >
                      {expanded[item.id] ? "Show less" : "Read more"}
                    </button>
                  )}
                </article>
              );
            })}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-800 dark:text-gray-300">
          {page + 1} of {Math.max(1, totalPages)}
        </p>

        <NavLink to="/AllFAQs" className={`${viewAllClass} md:hidden`}>
          View all
        </NavLink>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={prevPage}
            className={roundButton}
            disabled={page === 0}
            aria-label="Previous questions"
          >
            <FiArrowLeft size={18} />
          </button>

          <button
            type="button"
            onClick={nextPage}
            className={roundButton}
            disabled={page >= totalPages - 1}
            aria-label="Next questions"
          >
            <FiArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default FAQSection;