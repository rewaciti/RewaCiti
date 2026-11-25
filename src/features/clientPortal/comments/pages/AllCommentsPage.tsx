import Navbar from "../../../shared/components/Layout/Navbar";
import { useEffect } from "react";
import { useCommentStore } from "../store/useCommentStore";
import type { Comment } from "../../../types";
import Footer from "../../../shared/components/Layout/Footer";
import { Helmet } from "react-helmet-async";
import { CommentCardSkeleton } from "../../../shared/components/ui/Skeletons";

// Same container as the Navbar so the page edges line up with it.
const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10";

const Stars = ({ rating }: { rating: number }) => {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div role="img" aria-label={`Rated ${filled} out of 5`} className="flex gap-0.5 text-lg leading-none">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={i < filled ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}
        >
          ★
        </span>
      ))}
    </div>
  );
};

function AllComments() {
  const { comments, loading, fetchComments } = useCommentStore();

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-black/30">
      <Helmet>
        <title>Customer Comments | RewaCiti</title>
        <meta
          name="description"
          content="Read reviews and customer testimonials for RewaCiti's real estate and student housing services in Ile-Ife."
        />
        <meta property="og:title" content="Customer Comments | RewaCiti" />
        <meta
          property="og:description"
          content="See what clients say about RewaCiti's properties, student housing, and real estate support."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://rewaciti.com/allcomments" />
      </Helmet>

      <Navbar />

      <main className="flex-1 py-10 sm:py-14">
        <div className={CONTAINER}>
          {/* Page header */}
          <header className="mb-8 max-w-2xl sm:mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              What our clients say
            </h1>
            <p className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-400">
              Reviews from people who have found, rented or listed properties
              with RewaCiti.
            </p>
          </header>

          {/* Comments grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {loading ? (
              [...Array(6)].map((_, i) => <CommentCardSkeleton key={i} />)
            ) : comments.length === 0 ? (
              <p className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600 dark:border-white/15 dark:bg-[#1A1A1A] dark:text-gray-400">
                No reviews yet. Check back soon.
              </p>
            ) : (
              comments.map((comment: Comment) => (
                <article
                  key={comment.id}
                  className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm transition-colors hover:border-[#703BF7]/50 dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white dark:hover:border-[#a98bff]/50"
                >
                  <Stars rating={comment.rating} />

                  <h2 className="mt-3 mb-2 text-lg font-semibold leading-snug">
                    {comment.summary}
                  </h2>

                  <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {comment.description}
                  </p>

                  {/* Reviewer */}
                  <footer className="mt-auto flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
                    <img
                      src={comment.img}
                      alt={comment.name}
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 shrink-0 rounded-full bg-gray-200 object-cover dark:bg-white/10"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">
                        {comment.name}
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          comment.location,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-sm text-gray-500 transition-colors hover:text-[#703BF7] dark:text-gray-400 dark:hover:text-[#a98bff]"
                      >
                        {comment.location}
                      </a>
                    </div>
                  </footer>
                </article>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AllComments;