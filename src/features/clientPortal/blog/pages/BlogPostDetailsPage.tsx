import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router";
import Navbar from "../../../shared/components/Layout/Navbar";
import Footer from "../../../shared/components/Layout/Footer";
import { useBlogStore } from "../store/useBlogStore";
import type { BlogPost } from "../../../types";
import { FiArrowLeft, FiCalendar, FiUser, FiTag } from "react-icons/fi";
import { Helmet } from "react-helmet-async";
import { Skeleton } from "../../../shared/components/ui/Skeleton";

const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";
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
      <div className="min-h-screen bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
        <Navbar />
        <main className={`${PAGE_CONTAINER} py-8 sm:py-10`}>
          <Skeleton className="mb-8 h-5 w-28" />
          <Skeleton className="mb-6 h-10 w-3/4" />
          <Skeleton className="mb-8 h-72 w-full rounded-3xl sm:h-[400px]" />
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="mt-8 h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
        <Navbar />
        <main className={`${PAGE_CONTAINER} py-20 text-center`}>
          <h1 className="mb-4 text-3xl font-semibold text-gray-900 dark:text-white">Post not found</h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">The blog post you are looking for does not exist.</p>
          <Link to="/blog" className="inline-flex items-center justify-center gap-2 text-[#703BF7] hover:underline dark:text-[#b79bff]">
            <FiArrowLeft /> Back to blog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
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

      <header className="border-b border-gray-900/20 bg-linear-to-r from-gray-300/50 to-gray-400 py-5 dark:border-white/10 dark:from-neutral-600/20 dark:to-black/60">
        <div className={`${PAGE_CONTAINER} space-y-1`}>
          <Link to="/blog" className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[#703BF7] hover:underline dark:text-[#b79bff]">
            <FiArrowLeft /> Back to blog
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#703BF7] dark:text-[#b79bff]">
            {post.category}
          </p>
          <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-gray-900 dark:text-white md:text-4xl">
            {post.title}
          </h1>
        </div>
      </header>

      <main className={`${PAGE_CONTAINER} py-8 sm:py-10`}>
        <article className="mx-auto max-w-4xl">

          <img 
            src={post.image} 
            alt={post.title} 
            className="mb-8 h-72 w-full rounded-3xl border border-gray-900/15 object-cover dark:border-white/10 sm:h-[400px]"
            loading="lazy"
            decoding="async"
          />

          <div className="mb-6 flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
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

          <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed text-gray-700 dark:text-gray-300">
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

          <div className="mt-12 border-t border-gray-900/20 pt-8 dark:border-white/10">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className="mx-auto mt-10 max-w-4xl border-t border-gray-900/20 pt-8 dark:border-white/10">
            <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">Related posts</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {relatedPosts.map((related) => (
                <Link key={related.id} to={`/blog/${related.slug}`} className="group">
                  <div className="h-full overflow-hidden rounded-2xl border border-gray-900/15 bg-white transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-[#1A1A1A]">
                    <img
                      src={related.image}
                      alt={related.title}
                      loading="lazy"
                      decoding="async"
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-[#703BF7] dark:text-white">
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
