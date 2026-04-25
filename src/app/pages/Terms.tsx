import Navbar from "../../shared/components/Layout/Navbar";
import Footer from "../../shared/components/Layout/Footer";

const Terms = () => {
  return (
    <div className="bg-gray-100 dark:bg-black/30 min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Terms of Use
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Last Updated: March 2026
        </p>

        {/* 1 INTRODUCTION */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p>
            RewaCiti is a digital real estate platform designed to connect users
            with verified property agents and facilitate secure property
            interactions. By accessing or using this platform, you acknowledge
            that you have read, understood, and agreed to be bound by these Terms
            of Use, including all applicable policies and procedures.
          </p>
        </section>

        {/* 2 AGENT ACCOUNT & VERIFICATION */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            2. Agent Accounts & Verification
          </h2>
          <p>
            Only duly verified agents are permitted to list properties on the
            platform. Applicants must provide accurate, complete, and up-to-date
            information, including identity documentation and supporting
            materials required for verification.
          </p>
          <p className="mt-2">
            Verification is conducted at our discretion and may take up to{" "}
            <strong>24–48 hours</strong>. RewaCiti reserves the right to approve,
            reject, or revoke any agent application without prior notice.
          </p>
        </section>

        {/* 3 PROPERTY LISTING & APPROVAL */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            3. Property Listing & Approval
          </h2>
          <p>
            All property listings are subject to administrative review prior to
            publication. Listings will remain in a{" "}
            <strong>pending status</strong> until they have been reviewed and
            approved.
          </p>
          <p className="mt-2">
            This review process, which may take up to{" "}
            <strong>24–48 hours</strong>, is implemented to ensure data accuracy,
            quality assurance, and fraud prevention.
          </p>
        </section>

        {/* 4 PROPERTY MANAGEMENT */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            4. Property Management & Permissions
          </h2>
          <p>
            Agents retain control solely over properties they have submitted and
            do not have access to modify or manage listings created by other
            agents.
          </p>
          <p className="mt-2">
            Deleted listings will be temporarily withdrawn from public view and
            placed in a pending state. Permanent deletion of any property listing
            is restricted to platform administrators.
          </p>
        </section>

        {/* 5 PROPERTY VISITS & PAYMENTS */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            5. Property Visits & Payments
          </h2>

          <p>
            Property inspections are subject to a visitation fee, which may vary
            depending on location and logistics. Applicable fees will be clearly
            displayed at the point of booking.
          </p>

          <p className="mt-2 font-semibold text-blue-600 dark:text-blue-400">
            Important Note on Large Transactions:
          </p>
          <p className="mt-1 italic">
            For security reasons, any single transaction exceeding{" "}
            <strong>₦5,000,000 (Five Million Naira)</strong> cannot be processed
            via our standard online payment gateway. Users intending to make
            payments above this threshold must contact our support team
            directly to arrange for a secure bank transfer and manual
            validation.
          </p>

          <p className="mt-2 font-semibold">Payment Safety Guidelines:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Always ensure your bank's daily transfer limit supports the transaction amount.</li>
            <li>High-value transactions may trigger fraud alerts or require additional bank authorization.</li>
            <li>Users are encouraged to download and save payment receipts immediately after a successful transaction.</li>
            <li>
              <strong>
                All payments must be processed exclusively through the platform or verified official bank accounts provided by support.
              </strong>
            </li>
          </ul>

          <p className="mt-2">
            Users are strongly advised against engaging in off-platform
            transactions. RewaCiti shall not be held liable for any loss, fraud,
            or dispute arising from payments made outside the platform.
          </p>

          <p className="mt-2">
            Any form of misconduct, misrepresentation, or unethical behavior by
            an agent must be reported through the designated reporting channels
            on the platform.
          </p>

          <p className="mt-2">
            Agents found to be in violation of platform policies may be subject
            to sanctions including <strong>account suspension, restriction, or
            permanent termination</strong>.
          </p>

          <p className="mt-2">
            <strong>
              Any attempt to bypass the platform’s payment system or use unauthorized payment methods will result in
              immediate and permanent account termination.
            </strong>
          </p>

          <p className="mt-2">
            Property visits must be scheduled at least{" "}
            <strong>48 hours in advance</strong> and are subject to confirmation.
          </p>

          <p className="mt-2">
            Payments are non-refundable except in cases where failure of service
            is attributable to the platform or agent (e.g., agent absence or
            inaccurate property availability).
          </p>
        </section>

        {/* 6 RESPONSE TIME */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">6. Response Time</h2>
          <p>
            All inquiries, applications, and support requests are typically
            addressed within <strong>24 hours</strong>.
          </p>
        </section>

        {/* 7 DATA & PRIVACY */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">7. Data & Privacy</h2>
          <p>
            We collect and process personal data including names, contact
            information, and submitted documents for the purposes of user
            verification, communication, and service optimization.
          </p>
          <p className="mt-2">
            All data is handled in accordance with applicable data protection
            standards and will only be disclosed where necessary for operational
            or legal purposes.
          </p>
        </section>

        {/* 8 MEDIA OPTIMIZATION */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            8. Media Optimization
          </h2>
          <p>
            Uploaded media, including images and videos, may be processed,
            compressed, or optimized to enhance performance, storage efficiency,
            and overall user experience.
          </p>
        </section>

        {/* 9 RESPONSIBILITIES */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            9. User Responsibilities
          </h2>
          <ul className="list-disc ml-6">
            <li>Provide accurate, complete, and truthful information</li>
            <li>Avoid fraudulent, deceptive, or misleading listings</li>
            <li>Conduct themselves responsibly during property visits</li>
          </ul>
        </section>

        {/* 10 LIABILITY */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            10. Limitation of Liability
          </h2>
          <p>
            RewaCiti shall not be liable for any indirect, incidental, or
            consequential damages arising from user interactions, property
            visits, or third-party engagements conducted through the platform.
          </p>
        </section>

        {/* 11 CHANGES */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            11. Changes to Terms
          </h2>
          <p>
            We reserve the right to amend these Terms at any time. Continued use
            of the platform following any updates constitutes acceptance of the
            revised Terms.
          </p>
        </section>

        {/* 12 CONTACT */}
        <section className="bg-white/90 dark:bg-[#1A1A1A] border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">12. Contact Us</h2>
          <p>
            For inquiries, complaints, or support requests, please contact us at{" "}
            <strong>rewaciti@gmail.com</strong>.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;