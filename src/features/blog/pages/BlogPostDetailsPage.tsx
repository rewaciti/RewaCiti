import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import Navbar from "../../../shared/components/Layout/Navbar";
import Footer from "../../../shared/components/Layout/Footer";
import { useBlogStore } from "../store/useBlogStore";
import type { BlogPost } from "../../../types";
import { FiArrowLeft, FiCalendar, FiUser, FiTag } from "react-icons/fi";

const BlogPostDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { getPostBySlug, fetchPosts, loading } = useBlogStore();
  const [post, setPost] = useState<BlogPost | undefined>(undefined);

  useEffect(() => {
    const loadPost = async () => {
      await fetchPosts();
      if (slug) {
        const foundPost = getPostBySlug(slug);
        setPost(foundPost);
        if (foundPost) {
          document.title = `${foundPost.title} - RewaCiti Blog`;
        }
      }
    };
    loadPost();
  }, [slug, fetchPosts, getPostBySlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-300 dark:bg-black/30 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#703BF7]"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-300 dark:bg-black/30">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Post Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">The blog post you are looking for does not exist.</p>
          <Link to="/blog" className="text-[#703BF7] hover:underline flex items-center justify-center gap-2">
            <FiArrowLeft /> Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-300 dark:bg-black/30">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <Link to="/blog" className="inline-flex items-center gap-2 text-[#703BF7] hover:underline mb-8 font-medium">
          <FiArrowLeft /> Back to Blog
        </Link>

        <article>
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-[400px] rounded-3xl mb-8 border border-gray-700/40"
          />

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <div className="flex items-center gap-2">
              <FiUser className="text-[#703BF7]" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar className="text-[#703BF7]" />
              <span>{new Date(post.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiTag className="text-[#703BF7]" />
              <span>{post.category}</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
            {post.title}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
            {post.content.split('\n').map((paragraph, index) => {
              if (!paragraph.trim()) return <div key={index} className="h-4" />;
              
              const parts = paragraph.split(/(\*\*.*?\*\*)/g);
              return (
                <p key={index} className="mb-4">
                  {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </p>
              );
            })}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700/40">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostDetailsPage;
