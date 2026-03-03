import Navbar from "../Components/Navbar";
import { useEffect } from "react";
import { useFAQStore } from "../Store/useFAQStore";
import type { FAQ } from "../types";
import  Footer from "../Components/Footer";

function AllFAQs() {
  const { faq, loading, fetchFAQs } = useFAQStore();

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  if (loading) {
    return (
      <p className="text-center text-white py-10">
        Loading FAQs...
      </p>
    );
  }

  return (
    <div className="bg-gray-300 dark:bg-black/30">
      <Navbar />
      <div className="w-[95%] mx-auto px-4 py-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {faq.map((item: FAQ) => (
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
          ))}
        </div>

      </div>
      <Footer/>
    </div>
  );
}

export default AllFAQs;
