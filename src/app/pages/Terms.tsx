import Navbar from "../../shared/components/Layout/Navbar";
import Footer from "../../shared/components/Layout/Footer";

const TermsPolicy = () => {
  return (
    <div className="bg-gray-100 dark:bg-black/30 min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Terms of Use & Privacy Policy
        </h1>

        {/* Sections */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            1. General Terms
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            By using this platform, you agree to follow all rules outlined here.
          </p>
        </section>

        <section className="bg-white/90 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            2. Property Visit Fee
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            All property visits require a payment of <strong>₦2,000</strong>.
          </p>
        </section>

        <section className="bg-white/90 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            3. Booking Visits
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Visits must be booked in advance and are subject to availability.
          </p>
        </section>

        <section className="bg-white/90 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            4. Personal Information
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Any personal data provided is used solely for inquiries and scheduling visits.
          </p>
        </section>

        <section className="bg-white/90 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            5. Responsibilities
          </h2>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300">
            <li>Provide accurate details in your inquiries.</li>
            <li>Follow all instructions during property visits.</li>
            <li>Respect the property and its surroundings.</li>
          </ul>
        </section>

        <section className="bg-white/90 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            6. Limitation of Liability
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            We are not responsible for any damages, accidents, or losses during visits.
          </p>
        </section>

        <section className="bg-white/90 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            7. Changes to Terms
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            We may update these terms at any time. You are responsible for reviewing them.
          </p>
        </section>

        <section className="bg-white/90 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            8. Contact Us
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Questions? Contact us at <strong>support@Rẹ́wàCity.com</strong>
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default TermsPolicy;