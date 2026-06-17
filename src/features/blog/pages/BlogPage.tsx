import { useEffect } from "react";
import Navbar from "../../../shared/components/Layout/Navbar";
import Footer from "../../../shared/components/Layout/Footer";
import { useBlogStore } from "../store/useBlogStore";
import { Link } from "react-router";
import { FiArrowLeft, FiArrowRight, FiCalendar, FiUser } from "react-icons/fi";
import { Helmet } from "react-helmet-async";

const BlogPage = () => {
  const { posts, loading, page, ITEMS_PER_PAGE, fetchPosts, nextPage, prevPage } = useBlogStore();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const currentPosts = posts.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-300 dark:bg-black/30">
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
      <div className="bg-linear-to-r dark:from-neutral-600/20 from-gray-300/50 dark:to-black/60 to-gray-400 p-5 py-10 space-y-6 border-b border-gray-600">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-gray-900 dark:text-white md:text-5xl text-3xl font-bold mb-4">
            RewaCiti Blog
          </h1>
          <p className="text-gray-800 dark:text-gray-400 text-lg">
            Stay updated with the latest trends, tips, and insights in the Nigerian real estate market.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#703BF7]"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {currentPosts.map((post) => (
                <article key={post.id} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-700/40 overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                  <Link to={`/blog/${post.slug}`}>
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-60"
                    />
                  </Link>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-4 text-xs text-[#703BF7] font-medium mb-3">
                      <span className="bg-[#703BF7]/10 px-2 py-1 rounded">{post.category}</span>
                    </div>
                    <Link to={`/blog/${post.slug}`}>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-[#703BF7] transition-colors">
                        {post.title}
                      </h2>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                      {post.summary}
                    </p>
                    <Link 
                      to={`/blog/${post.slug}`}
                      className="inline-block bg-[#703BF7] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#5c2fe0] transition-colors w-fit mb-4"
                    >
                      Read More
                    </Link>
                    <div className="mt-auto pt-4 border-t border-gray-700/40 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <div className="flex items-center gap-1">
                        <FiUser size={14} />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiCalendar size={14} />
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-between items-center text-white border-t border-gray-700/40 pt-8">
                <p className="text-sm text-black dark:text-white">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={prevPage}
                    disabled={page === 0}
                    className="px-4 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600 hover:bg-[#703BF7] transition-colors flex items-center gap-2"
                  >
                    <FiArrowLeft size={18} />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={nextPage}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 border border-gray-500 rounded-full disabled:opacity-30 bg-gray-600 hover:bg-[#703BF7] transition-colors flex items-center gap-2"
                  >
                    <span>Next</span>
                    <FiArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogPage;
