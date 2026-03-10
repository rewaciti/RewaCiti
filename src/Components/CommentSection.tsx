import { useEffect, useState } from "react";
import { useCommentStore } from "../Store/useCommentStore"; // Your Zustand store for comments
import type { Comment } from "../types";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { NavLink } from "react-router";

function CommentSection() {
  const { comments, loading, page, ITEMS_PER_PAGE, fetchComments, nextPage, prevPage } = useCommentStore();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  if (loading) {
    return <p className="text-center text-white py-10">Loading comments...</p>;
  }

  const totalPages = Math.ceil(comments.length / ITEMS_PER_PAGE);

  const currentComments: Comment[] = comments.slice(
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
      <div>
          <img
              src="/logo/Abstract Design (1).png"
              alt="Icon"
              className="w-13 h-13 object-contain"
            />
          <div className="flex justify-between items-center mb-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-white">What Our Clients Say </h1>
          <p className="dark:text-gray-400 text-gray-600 w-full">
           Read the success stories and heartfelt testimonials from our valued clients. Discover why they chose RewaCity for their real estate needs.
          </p>
        </div>

        <NavLink
          to="/AllComments"
          className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center w-[130px] hidden md:block"
        >
          View All
        </NavLink>
      </div>  
       </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {currentComments.map((comment) => (
          <div key={comment.id} className="rounded-xl p-5 text-gray-900 dark:text-white bg-white/90 dark:bg-[#1A1A1A] border border-purple-100 dark:border-gray-600/30">
            {/* Rating */}
            <p className="text-yellow-400 text-lg">
              {"★".repeat(comment.rating)}{"☆".repeat(5 - comment.rating)}
            </p>

            {/* Summary */}
            <h3 className="text-lg font-semibold mb-2">{comment.summary}</h3>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {expanded[comment.id] ? comment.description : truncateWords(comment.description, 10)}
              {comment.description.split(" ").length > 10 && (
                <button
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))
                  }
                  className="text-[#703BF7] ml-2 hover:underline"
                >
                  {expanded[comment.id] ? "Show less" : "... Read more"}
                </button>
              )}
            </p>

            {/* Reviewer Info */}
            <div className="flex items-center gap-3 mt-4">
              <img
                src={comment.img}
                alt={comment.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{comment.name}</p>
                <p className="text-gray-400 text-sm">{comment.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <hr className="h-px bg-gray-600 border-0 w-full my-5" />

      {/* Pagination */}
      <div className="flex justify-between items-center gap-4 text-white">
        <p className="text-sm text-black dark:text-white">{page + 1} of {totalPages}</p>
        <NavLink
          to="/AllComments"
          className="text-[#703BF7] border border-[#703BF7] px-4 py-2 rounded hover:bg-[#703BF7] hover:text-white transition text-center w-[120px]  md:hidden"
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

export default CommentSection;
