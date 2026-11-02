import { useEffect, useState } from "react";
import { useCommentStore } from "../store/useCommentStore"; // Your Zustand store for comments
import type { Comment } from "../../../types";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { NavLink } from "react-router";

import { CommentCardSkeleton } from "../../../shared/components/ui/Skeletons";

// Same container as the Navbar, Footer and every inner page.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Same serif as the Navbar (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

const viewAllClass =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#703BF7] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9677df]";
const roundButton =
  "cursor-pointer rounded-full border border-gray-300 bg-white p-2.5 text-gray-900 transition hover:border-[#703BF7] hover:text-[#703BF7] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:bg-[#101010] dark:text-white";

function CommentSection() {
  const { comments, loading, page, ITEMS_PER_PAGE, fetchComments, nextPage, prevPage } =
    useCommentStore();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const totalPages = Math.ceil(comments.length / ITEMS_PER_PAGE);

  const currentComments: Comment[] = comments.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE,
  );

  function truncateWords(text: string, limit: number): string {
    const words = text.split(" ");
    return words.length <= limit ? text : words.slice(0, limit).join(" ");
  }

  return (
    <div className={PAGE_CONTAINER}>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#703BF7] dark:text-[#b79bff]">Testimonials</p>
          <h2
            style={SERIF}
            className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl"
          >
            What our clients say
          </h2>
          <p className="mt-3 text-gray-700 dark:text-gray-400">
            Read the success stories and heartfelt testimonials from our valued clients. Discover
            why they chose RewaCiti for their real estate needs.
          </p>
        </div>

        <NavLink to="/AllComments" className={`${viewAllClass} hidden md:inline-flex`}>
          View all <FiArrowRight size={16} />
        </NavLink>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        {loading
          ? [...Array(3)].map((_, i) => <CommentCardSkeleton key={i} />)
          : currentComments.map((comment) => {
              const isLong = comment.description.split(" ").length > 10;
              return (
                <article
                  key={comment.id}
                  className="flex flex-col rounded-3xl border border-gray-200 bg-white p-6 text-gray-900 dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white"
                >
                  {/* Rating */}
                  <p
                    className="text-lg tracking-wide text-amber-400"
                    aria-label={`${comment.rating} out of 5 stars`}
                  >
                    {"★".repeat(comment.rating)}
                    {"☆".repeat(5 - comment.rating)}
                  </p>

                  {/* Summary */}
                  <h3 style={SERIF} className="mb-2 mt-2 text-lg font-semibold">
                    {comment.summary}
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                    {expanded[comment.id]
                      ? comment.description
                      : truncateWords(comment.description, 10)}
                    {isLong && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))
                        }
                        className="ml-2 cursor-pointer font-semibold text-[#703BF7] hover:underline dark:text-[#b79bff]"
                      >
                        {expanded[comment.id] ? "Show less" : "... Read more"}
                      </button>
                    )}
                  </p>

                  {/* Reviewer Info */}
                  <div className="mt-auto flex items-center gap-3 border-t border-gray-200 pt-5 dark:border-white/10">
                    <img
                      src={comment.img}
                      alt={comment.name}
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{comment.name}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          comment.location,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-sm text-gray-500 transition-colors hover:text-[#703BF7] dark:text-gray-400"
                      >
                        {comment.location}
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-400/60 pt-6 dark:border-white/10">
        <p className="text-sm text-gray-800 dark:text-gray-300">
          {page + 1} of {Math.max(1, totalPages)}
        </p>

        <NavLink to="/AllComments" className={`${viewAllClass} md:hidden`}>
          View all
        </NavLink>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={prevPage}
            className={roundButton}
            disabled={page === 0}
            aria-label="Previous testimonials"
          >
            <FiArrowLeft size={18} />
          </button>

          <button
            type="button"
            onClick={nextPage}
            className={roundButton}
            disabled={page >= totalPages - 1}
            aria-label="Next testimonials"
          >
            <FiArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommentSection;