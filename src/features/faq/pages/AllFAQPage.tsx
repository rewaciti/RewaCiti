import Navbar from "../../../shared/components/Layout/Navbar";
import { useEffect } from "react";
import { useFAQStore } from "../store/useFAQStore";
import type { FAQ } from "../../../types";
import Footer from "../../../shared/components/Layout/Footer";
import { Helmet } from "react-helmet-async";
import { FAQCardSkeleton } from "../../../shared/components/ui/Skeletons";

function AllFAQs() {
  const { faq, loading, fetchFAQs } = useFAQStore();

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  return (
    <div className="bg-gray-300 dark:bg-black/30">
      <Helmet>
        <title>Frequently Asked Questions | RewaCiti</title>
        <meta name="description" content="Find answers to common questions about RewaCiti's real estate listings, student housing, and property services in Ile-Ife." />
        <meta property="og:title" content="Frequently Asked Questions | RewaCiti" />
        <meta property="og:description" content="Explore RewaCiti's FAQ for guidance on property searches, housing options, and platform support." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://rewaciti.com/allfaqs" />
      </Helmet>
      <Navbar />
      <div className="w-[98%] mx-auto px-2 py-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <FAQCardSkeleton key={i} />
            ))
          ) : (
            faq.map((item: FAQ) => (
              <div
                key={item.id}
                className="border border-gray-600/30 rounded-xl p-4 text-gray-900 dark:text-white bg-white/90 dark:bg-[#1A1A1A]"
              >
                {/* Question */}
                <h4 className="text-lg font-semibold mb-2">{item.question}</h4>

                {/* Answer */}
                <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))
          )}
        </div>

      </div>
      <Footer/>
    </div>
  );
}

export default AllFAQs;
