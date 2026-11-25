import { useEffect } from "react";
import Navbar from "../../../shared/components/Layout/Navbar";
import Footer from "../../../shared/components/Layout/Footer";
import { useBlogStore } from "../store/useBlogStore";
import { Link } from "react-router";
import { FiArrowLeft, FiArrowRight, FiCalendar, FiUser } from "react-icons/fi";
import { Helmet } from "react-helmet-async";
import { Skeleton } from "../../../shared/components/ui/Skeleton";

const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";
const paginationButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-[#703BF7] hover:text-[#703BF7] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:bg-[#101010] dark:text-white dark:hover:border-[#b79bff] dark:hover:text-[#b79bff]";

const BlogCardSkeleton = () => (
  <article className="overflow-hidden rounded-2xl border border-gray-900/15 bg-white dark:border-white/10 dark:bg-[#1A1A1A]">
    <Skeleton className="h-60 w-full rounded-none" />
    <div className="space-y-4 p-6">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-9 w-28 rounded-lg" />
      <div className="flex justify-between border-t border-gray-200 pt-4 dark:border-white/10">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  </article>
);

const BlogPage = () => {
  const { posts, loading, page, ITEMS_PER_PAGE, fetchPosts, nextPage, prevPage } = useBlogStore();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const currentPosts = posts.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
      <Helmet>
        <title>RewaCiti Blog - Real Estate Tips, Tourism & Insights in Nigeria</title>
        <meta name="description" content="Stay updated with the latest trends, tips, and insights in the Nigerian real estate market, tourism in Ile-Ife, and Osun State accommodation guides." />
        <meta property="og:title" content="RewaCiti Blog - Real Estate & Lifestyle Insights" />
        <meta property="og:description" content="Explore our blog for the best real estate tips and tourism guides in Nigeria." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://rewaciti.com/blog" />
      </Helmet>

      <Navbar />
      
      {/* Hero Section */}
      <header className="border-b border-gray-300 bg-gray-300 py-7 dark:border-white/10 dark:bg-black/30 sm:py-9">
        <div className={`${PAGE_CONTAINER} space-y-1`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#703BF7] dark:text-[#b79bff]">
            Insights
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white md:text-4xl">
            RewaCiti Blog
          </h1>
          <p className="max-w-2xl text-sm text-gray-800 dark:text-gray-400">
            Stay updated with the latest trends, tips, and insights in the Nigerian real estate market.
          </p>
        </div>
      </header>

      <main className="bg-gray-200 py-8 dark:bg-black/50 sm:py-10">
        <div className={PAGE_CONTAINER}>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
              <BlogCardSkeleton key={index} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-900/20 bg-white p-10 text-center text-sm text-gray-600 dark:border-white/15 dark:bg-[#1A1A1A] dark:text-gray-400">
            No blog posts are available right now. Please check back soon.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {currentPosts.map((post) => (
                <article key={post.id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-900/15 bg-white transition-shadow duration-300 hover:shadow-lg dark:border-white/10 dark:bg-[#1A1A1A]">
                  <Link to={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}>
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      loading="lazy"
                      decoding="async"
                      className="h-60 w-full object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex items-center gap-4 text-xs font-medium text-[#703BF7] dark:text-[#b79bff]">
                      <span className="rounded-full bg-[#703BF7]/10 px-3 py-1">{post.category}</span>
                    </div>
                    <Link to={`/blog/${post.slug}`}>
                      <h2 className="mb-3 text-xl font-semibold text-gray-900 transition-colors hover:text-[#703BF7] dark:text-white">
                        {post.title}
                      </h2>
                    </Link>
                    <p className="mb-4 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                      {post.summary}
                    </p>
                    <Link 
                      to={`/blog/${post.slug}`}
                      className="mb-4 inline-flex w-fit items-center rounded-full bg-[#703BF7] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#5c2fe0]"
                    >
                      Read More
                    </Link>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-900/15 pt-4 text-xs text-gray-600 dark:border-white/10 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <FiUser size={14} />
                        <span className="truncate">{post.author}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <FiCalendar size={14} />
                        <span>{new Date(post.date).toLocaleDateString("en-GB")}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-900/20 pt-6 dark:border-white/10">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={prevPage}
                    disabled={page === 0}
                    className={paginationButton}
                  >
                    <FiArrowLeft size={18} />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={nextPage}
                    disabled={page >= totalPages - 1}
                    className={paginationButton}
                  >
                    <span>Next</span>
                    <FiArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPage;
