import Navbar from "../../shared/components/Layout/Navbar";
import Footer from "../../shared/components/Layout/Footer";

const TermsPolicy = () => {
  return (
    <div className="bg-gray-100 dark:bg-black/30 min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Terms of Use & Privacy Policy
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Last Updated: March 2026
        </p>

        {/* 1 INTRODUCTION */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p>
            RewaCiti is a platform that connects users with verified property agents.
            By using this platform, you agree to our terms, policies, and verification processes.
          </p>
        </section>

        {/* 2 AGENT ACCOUNT & VERIFICATION */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">2. Agent Accounts & Verification</h2>
          <p>
            Only approved agents can list properties. To become an agent, users must submit
            accurate information including email, identity details, images, and verification materials.
          </p>
          <p className="mt-2">
            Verification may take up to <strong>24–48 hours</strong>. We reserve the right to approve or reject any application.
          </p>
        </section>

        {/* 3 PROPERTY LISTING & APPROVAL */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">3. Property Listing & Approval</h2>
          <p>
            All uploaded properties are subject to review before being published.
            Listings will remain in a <strong>pending state</strong> until approved.
          </p>
          <p className="mt-2">
            Approval may take up to <strong>24–48 hours</strong> to ensure accuracy and prevent fraud.
          </p>
        </section>

        {/* 4 PROPERTY MANAGEMENT */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">4. Property Management & Permissions</h2>
          <p>
            Agents can only manage properties they upload. They cannot access other agents’ listings.
          </p>
          <p className="mt-2">
            If an agent removes a property, it will be temporarily hidden from users and marked as pending.
            Only the super admin has the authority to permanently delete properties.
          </p>
        </section>

        {/* 5 PROPERTY VISITS */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">5. Property Visits</h2>

          <p>
           All property visits require a visitation fee, which varies based on the property's location.
            The exact fee will be displayed during the booking process.
          </p>

          <p className="mt-2">
            All payments must be made strictly through the platform. Users are advised not to make
            any payments directly to agents outside the platform.The platform is not responsible for any losses resulting from payments made outside the platform.
            Any such transactions are done at the user's own risk.
          </p>

          <p className="mt-2">
            Visits must be booked at least <strong>48 hours in advance</strong> and are subject to confirmation.
          </p>

          <p className="mt-2">
           Payments are generally non-refundable. However, refunds may only be considered if the issue
            is directly caused by the platform, such as an agent failing to show up or a property being
            unavailable but still listed.
          </p>

        </section>

        {/* 6 RESPONSE TIME */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">6. Response Time</h2>
          <p>
            All requests, including agent applications and inquiries, will be responded to within
            <strong> 24 hours</strong>.
          </p>
          <p className="mt-2">
            If you do not receive a response within this time, please contact us again through the contact page.
          </p>
        </section>

        {/* 7 DATA & PRIVACY */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">7. Data & Privacy</h2>
          <p>
            We collect personal information such as names, emails, and submitted documents
            for verification, communication, and service improvement.
          </p>
          <p className="mt-2">
            Your data is handled securely and will not be shared except where necessary for platform operations or legal requirements.
          </p>
        </section>

        {/* 8 MEDIA OPTIMIZATION */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">8. Media Optimization</h2>
          <p>
            Images and videos uploaded to the platform may be automatically compressed or optimized
            to improve performance and user experience.
          </p>
        </section>

        {/* 9 RESPONSIBILITIES */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">9. User Responsibilities</h2>
          <ul className="list-disc ml-6">
            <li>Provide accurate and truthful information.</li>
            <li>Avoid fraudulent or misleading property listings.</li>
            <li>Respect properties during visits.</li>
          </ul>
        </section>

        {/* 10 LIABILITY */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">10. Limitation of Liability</h2>
          <p>
            RewaCiti is not responsible for damages, losses, or disputes arising from property visits or agent interactions.
          </p>
        </section>

        {/* 11 CHANGES */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">11. Changes to Terms</h2>
          <p>
            We may update these terms at any time. Continued use of the platform means you accept the updated terms.
          </p>
        </section>

        {/* 12 CONTACT */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">12. Contact Us</h2>
          <p>
            For questions or complaints, contact us at <strong>rewaCity@yahoo.com</strong>
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default TermsPolicy;