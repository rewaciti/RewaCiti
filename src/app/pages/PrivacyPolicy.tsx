import Navbar from "../../shared/components/Layout/Navbar";
import Footer from "../../shared/components/Layout/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-100 dark:bg-black/30 min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Privacy Policy
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Last Updated: March 2026
        </p>

        {/* 1 SCOPE */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            1. Scope of This Policy
          </h2>
          <p>
            This Privacy Policy governs how RewaCiti collects, processes, and
            protects personal data across its platform. It applies to all users,
            including property seekers, verified agents, and general visitors
            interacting with our services.
          </p>
        </section>

        {/* 2 INFORMATION WE COLLECT */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            2. Information We Collect
          </h2>

          <p className="font-medium">Personal Information</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Full name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Account credentials</li>
          </ul>

          <p className="font-medium">Verification Data (Agents)</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Identification documents</li>
            <li>Profile images</li>
            <li>Verification materials</li>
          </ul>

          <p className="font-medium">Transaction & Interaction Data</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Property inquiries and bookings</li>
            <li>Messages exchanged on the platform</li>
            <li>Payment-related records</li>
          </ul>

          <p className="font-medium">Technical & Usage Data</p>
          <ul className="list-disc ml-6">
            <li>IP address</li>
            <li>Device and browser information</li>
            <li>Usage activity and page interactions</li>
          </ul>
        </section>

        {/* 3 HOW WE USE DATA */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc ml-6">
            <li>Account creation and management</li>
            <li>Facilitating property listings and transactions</li>
            <li>Enabling secure communication between users</li>
            <li>Verification and fraud prevention</li>
            <li>Improving platform performance and experience</li>
            <li>Compliance with legal obligations</li>
          </ul>
        </section>

        {/* 4 LEGAL BASIS */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            4. Legal Basis for Processing
          </h2>
          <ul className="list-disc ml-6">
            <li>User consent</li>
            <li>Contractual necessity</li>
            <li>Legitimate interests (e.g., security, fraud prevention)</li>
            <li>Legal and regulatory compliance</li>
          </ul>
        </section>

        {/* 5 DATA SHARING */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            5. Sharing and Disclosure
          </h2>
          <p>
            Personal data may be shared with relevant parties where necessary,
            including agents, property owners, service providers, and regulatory
            authorities. Such sharing is limited to what is required for service
            delivery, compliance, and platform protection.
          </p>
          <p className="mt-2">
            RewaCiti does not sell or trade user personal data to third parties.
          </p>
        </section>

        {/* 6 DATA RETENTION */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            6. Data Retention
          </h2>
          <p>
            Personal data is retained only for as long as necessary to fulfill
            operational, legal, and contractual obligations. Data that is no
            longer required is securely deleted or anonymized.
          </p>
        </section>

        {/* 7 DATA SECURITY */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            7. Data Security
          </h2>
          <p>
            We employ industry-standard security measures, including encryption,
            secure authentication systems, and controlled access mechanisms, to
            protect user data against unauthorized access or misuse.
          </p>
        </section>

        {/* 8 COOKIES */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            8. Cookies & Tracking Technologies
          </h2>
          <p>
            Cookies and similar technologies are used to enhance functionality,
            store preferences, and analyze user behavior. Users may manage cookie
            preferences through their browser settings.
          </p>
        </section>

        {/* 9 USER RIGHTS */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            9. User Rights
          </h2>
          <ul className="list-disc ml-6">
            <li>Access personal data</li>
            <li>Request correction or deletion</li>
            <li>Withdraw consent</li>
            <li>Restrict or object to processing</li>
            <li>Request data portability</li>
          </ul>
        </section>

        {/* 10 THIRD PARTY */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            10. Third-Party Services
          </h2>
          <p>
            The platform may integrate third-party services such as payment
            gateways or analytics providers. These services operate independently
            and are governed by their own privacy policies.
          </p>
        </section>

        {/* 11 INTERNATIONAL */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            11. International Data Transfers
          </h2>
          <p>
            Where applicable, data may be processed outside your jurisdiction.
            Appropriate safeguards are implemented to ensure continued data
            protection.
          </p>
        </section>

        {/* 12 CHILDREN */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            12. Children’s Privacy
          </h2>
          <p>
            RewaCiti does not knowingly collect or process data from individuals
            under the age of 18.
          </p>
        </section>

        {/* 13 UPDATES */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            13. Policy Updates
          </h2>
          <p>
            This Privacy Policy may be updated periodically. Continued use of the
            platform after updates constitutes acceptance of the revised policy.
          </p>
        </section>

        {/* 14 CONTACT */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            14. Contact Information
          </h2>
          <p>
            For privacy-related inquiries, requests, or complaints, please
            contact: <strong>rewaciti@gmail.com</strong>
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;