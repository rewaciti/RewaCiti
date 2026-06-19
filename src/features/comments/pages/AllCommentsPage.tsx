import Navbar from "../../../shared/components/Layout/Navbar";
import { useEffect } from "react";
import { useCommentStore } from "../store/useCommentStore";
import type { Comment } from "../../../types";
import Footer from "../../../shared/components/Layout/Footer";
import { Helmet } from "react-helmet-async";
import { CommentCardSkeleton } from "../../../shared/components/ui/Skeletons";

function AllComments() {
  const { comments, loading, fetchComments } = useCommentStore();

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <div className="bg-gray-300 dark:bg-black/30">
      <Helmet>
        <title>Customer Comments | RewaCiti</title>
        <meta name="description" content="Read reviews and customer testimonials for RewaCiti's real estate and student housing services in Ile-Ife." />
        <meta property="og:title" content="Customer Comments | RewaCiti" />
        <meta property="og:description" content="See what clients say about RewaCiti's properties, student housing, and real estate support." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://rewaciti.com/allcomments" />
      </Helmet>
      <Navbar />
      <div className="w-[98%] mx-auto px-2 py-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">All Comments</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <CommentCardSkeleton key={i} />
            ))
          ) : (
            comments.map((comment: Comment) => (
              <div
                key={comment.id}
                className="rounded-xl p-5 text-gray-900 dark:text-white bg-white/90 dark:bg-[#1A1A1A] border border-purple-100 dark:border-gray-600/30"
              >
                {/* Star Rating */}
                 <p className="text-yellow-400 text-lg">
                {"★".repeat(comment.rating)}{"☆".repeat(5 - comment.rating)}
              </p>


                {/* Summary */}
                <h4 className="text-md font-semibold mb-2">{comment.summary}</h4>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{comment.description}</p>

                <div className="flex">
                      <div className="flex justify-center">
                          <img
                          src={comment.img}
                          alt={comment.name}
                          className="w-20 h-20 rounded-full object-cover "
                          />
                      </div>
          
                      {/* Name + Location */}
                      <div>
                          <h3 className="text-lg font-semibold">{comment.name}</h3>
                          <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  comment.location
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-400 hover:text-[#703BF7] transition-colors"
                          >
                              {comment.location}
                          </a>
                      </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
      <Footer/>
    </div>
  );
}

export default AllComments;
