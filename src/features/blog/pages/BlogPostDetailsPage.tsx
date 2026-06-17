import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router";
import Navbar from "../../../shared/components/Layout/Navbar";
import Footer from "../../../shared/components/Layout/Footer";
import { useBlogStore } from "../store/useBlogStore";
import type { BlogPost } from "../../../types";
import { FiArrowLeft, FiCalendar, FiUser, FiTag } from "react-icons/fi";
import { Helmet } from "react-helmet-async";

const BlogPostDetailsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { getPostBySlug, fetchPosts, loading, posts } = useBlogStore();
  const [post, setPost] = useState<BlogPost | undefined>(undefined);

  useEffect(() => {
    const loadPost = async () => {
      await fetchPosts();
      if (slug) {
        const foundPost = getPostBySlug(slug);
        setPost(foundPost);
      }
    };
    loadPost();
  }, [slug, fetchPosts, getPostBySlug]);

  // Related posts logic: same category, excluding current post
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return posts
      .filter((p) => p.category === post.category && p.id !== post.id)
      .slice(0, 3);
  }, [post, posts]);

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
      <Helmet>
        <title>{post.title} | RewaCiti Blog</title>
        <meta name="description" content={post.summary} />
        <meta property="og:title" content={`${post.title} | RewaCiti`} />
        <meta property="og:description" content={post.summary} />
        <meta property="og:image" content={post.image} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:author" content={post.author} />
        <meta property="article:section" content={post.category} />
        <link rel="canonical" href={`https://rewaciti.com/blog/${post.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "image": [post.image],
            "datePublished": post.date,
            "author": [{
                "@type": "Organization",
                "name": post.author,
                "url": "https://rewaciti.com"
              }],
            "description": post.summary
          })}
        </script>
      </Helmet>

      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <Link to="/blog" className="inline-flex items-center gap-2 text-[#703BF7] hover:underline mb-8 font-medium">
          <FiArrowLeft /> Back to Blog
        </Link>

        <article>
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-[400px] rounded-3xl mb-8 border border-gray-700/40 object-cover"
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

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-10 pt-7 border-t border-gray-700/40">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link key={related.id} to={`/blog/${related.slug}`} className="group">
                  <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-700/40 overflow-hidden hover:shadow-lg transition-shadow">
                    <img src={related.image} alt={related.title} className="w-full h-40 object-cover" />
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#703BF7] transition-colors">
                        {related.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostDetailsPage;
