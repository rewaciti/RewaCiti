import logo from "/Symbol.png";
import { Send } from "lucide-react";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { Link } from "react-router";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { COMPANY_ID } from "../../../features/auth/store/useAuthStore";

// Same container as the Navbar and every page.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Same serif as the Navbar (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

const EMAIL = "rewaciti@gmail.com";
const PHONE_DISPLAY = "+234 706 530 4417";
const PHONE_TEL = "+2347065304417";

const linkClass =
  "text-sm text-gray-800 transition hover:text-[#703BF7] dark:text-gray-300 dark:hover:text-[#b79bff]";
const headingClass = "mb-4 text-sm font-semibold text-gray-900 dark:text-white";
const socialClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-gray-500/40 text-gray-800 transition hover:border-[#703BF7] hover:bg-[#703BF7] hover:text-white dark:border-white/20 dark:text-gray-300";

const explore = [
  { label: "Properties", to: "/properties" },
  { label: "Request a property", to: "/request-property" },
  { label: "Services", to: "/Service" },
  { label: "List your property", to: "/list-property" },
];

const company = [
  { label: "About", to: "/About" },
  { label: "Contact", to: "/Contact" },
  { label: "FAQ", to: "/#faq" },
];

function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyId: COMPANY_ID,

      pipelineId: "69cec882dd40685bfe20ad43",
      title: `Newsletter Subscription: ${email}`,
      name: "Newsletter Subscriber",
      email: email,
      note: "User subscribed to newsletter via footer form.",
    };

    try {
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);
      toast.success("Subscribed successfully!");
      setEmail("");
    } catch (error) {
      console.error("Error subscribing:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-gray-400 bg-gray-300 text-gray-900 dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white">
      <div className={`${PAGE_CONTAINER} py-12`}>
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:gap-12">
          {/* Brand + newsletter */}
          <div className="border-b border-gray-900/30 pb-8 dark:border-gray-400/30 sm:col-span-2 lg:col-span-1 lg:border-b-0 lg:pb-0">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={logo} alt="" className="h-9" />
              <span style={SERIF} className="text-[24px] font-semibold leading-none">
                RewaCiti
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-700 dark:text-gray-400">
              Find your next home in Ile-Ife. Verified listings, viewings you can book online.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-5 flex max-w-sm items-center gap-1 rounded-full border border-gray-500/50 bg-white p-1 pl-4 focus-within:border-[#703BF7] dark:border-white/20 dark:bg-[#101010]"
            >
              <input
                type="email"
                placeholder="Get updates on new properties"
                aria-label="Email address for property updates"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500 dark:text-white"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#703BF7] text-white transition hover:bg-[#9677df] disabled:opacity-50"
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Explore + Company keep their divided layout through tablet widths. */}
          <div className="grid grid-cols-2 divide-x divide-gray-900/30 border-b border-gray-900/30 pb-8 dark:divide-gray-400/30 dark:border-gray-400/30 lg:contents lg:divide-x-0 lg:border-b-0 lg:pb-0">
          <nav aria-label="Explore" className="pr-4 lg:pr-0">
            <h3 className={headingClass}>Explore</h3>
            <ul className="space-y-3">
              {explore.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company" className="pl-4 lg:pl-0">
            <h3 className={headingClass}>Company</h3>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          </div>

          {/* Contact + social */}
          <div>
            <h3 className={headingClass}>Get in touch</h3>
            <ul className="space-y-3">
              <li>
                <a href={`mailto:${EMAIL}`} className={`${linkClass} flex items-center gap-2.5`}>
                  <FiMail className="shrink-0" size={16} />
                  <span className="break-all">{EMAIL}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${PHONE_TEL}`}
                  className={`${linkClass} flex items-center gap-2.5`}
                >
                  <FiPhone className="shrink-0" size={16} />
                  <span>{PHONE_DISPLAY}</span>
                </a>
              </li>
              <li>
                <Link
                  to="/Contact#Ouroffices"
                  className={`${linkClass} flex items-start gap-2.5`}
                >
                  <FiMapPin className="mt-0.5 shrink-0" size={16} />
                  <span>51, Ramon Adedoyin way, Parakin, Ile-Ife, Osun State</span>
                </Link>
              </li>
            </ul>

            <div className="mt-5 flex gap-2">
              <a
                href="https://x.com/RewaCiti_001"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="RewaCiti on X"
                className={socialClass}
              >
                <FaXTwitter size={15} />
              </a>
              <a
                href="https://www.instagram.com/rewaciti/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="RewaCiti on Instagram"
                className={socialClass}
              >
                <FaInstagram size={16} />
              </a>
              <a
                href="https://www.youtube.com/@RewaCiti"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="RewaCiti on YouTube"
                className={socialClass}
              >
                <FaYoutube size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-gray-400 dark:border-white/10">
        <div
          className={`${PAGE_CONTAINER} flex flex-col items-center justify-between gap-3 py-5 text-sm text-gray-700 dark:text-gray-400 sm:flex-row`}
        >
          <span>© {currentYear} RewaCiti. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <Link to="/terms" className="transition hover:text-[#703BF7] dark:hover:text-[#b79bff]">
              Terms
            </Link>
            <Link
              to="/privacy-policy"
              className="transition hover:text-[#703BF7] dark:hover:text-[#b79bff]"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;