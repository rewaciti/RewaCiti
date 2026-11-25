import Navbar from "../../../shared/components/Layout/Navbar";
import { useEffect } from "react";
import { useFAQStore } from "../store/useFAQStore";
import type { FAQ } from "../../../types";
import Footer from "../../../shared/components/Layout/Footer";
import { Helmet } from "react-helmet-async";
import { FAQCardSkeleton } from "../../../shared/components/ui/Skeletons";

// Same container as the Navbar so the page edges line up with it.
const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10";

function AllFAQs() {
  const { faq, loading, fetchFAQs } = useFAQStore();

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-black/30">
      <Helmet>
        <title>Frequently Asked Questions | RewaCiti</title>
        <meta
          name="description"
          content="Find answers to common questions about RewaCiti's real estate listings, student housing, and property services in Ile-Ife."
        />
        <meta
          property="og:title"
          content="Frequently Asked Questions | RewaCiti"
        />
        <meta
          property="og:description"
          content="Explore RewaCiti's FAQ for guidance on property searches, housing options, and platform support."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://rewaciti.com/allfaqs" />
      </Helmet>

      <Navbar />

      <main className="flex-1 py-10 sm:py-14">
        <div className={CONTAINER}>
          {/* Page header */}
          <header className="mb-8 max-w-2xl sm:mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Frequently asked questions
            </h1>
            <p className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-400">
              Answers about finding, listing and renting properties on
              RewaCiti.
            </p>
          </header>

          {/* FAQ grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {loading ? (
              [...Array(6)].map((_, i) => <FAQCardSkeleton key={i} />)
            ) : faq.length === 0 ? (
              <p className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600 dark:border-white/15 dark:bg-[#1A1A1A] dark:text-gray-400">
                No questions have been added yet. Check back soon.
              </p>
            ) : (
              faq.map((item: FAQ) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm transition-colors hover:border-[#703BF7]/50 dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white dark:hover:border-[#a98bff]/50"
                >
                  <h2 className="mb-2 text-lg font-semibold leading-snug">
                    {item.question}
                  </h2>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {item.answer}
                  </p>
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

export default AllFAQs;