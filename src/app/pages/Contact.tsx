import Navbar from "../../shared/components/Layout/Navbar";
import { FaEnvelope, FaPhone, FaDirections } from "react-icons/fa";
import { FiMapPin } from "react-icons/fi";
import Footer from "../../shared/components/Layout/Footer";
import useScrollToHash from "../../shared/hooks/useScrollToHash";
import { Helmet } from "react-helmet-async";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "../../features/auth/store/useAuthStore";
import { authAPI } from "../../features/auth/services/authAPI";
import { requestsAPI } from "../../features/properties/services/requestsAPI";
import { errorMessage, noteTestMode } from "../../shared/lib/realEstateApi";
import useRequestKey from "../../shared/hooks/useRequestKey";
import CustomDropdown from "../../features/properties/components/CustomDropdown";
import { getCookie, setCookie } from "../../shared/lib/utils";

// Same container as the Navbar, Property Details, Account, Request and Service pages.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Same serif as the Navbar / Home hero (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

const EMAIL = "rewaciti@gmail.com";
const PHONE_DISPLAY = "+234 706 530 4417";
const PHONE_TEL = "+2347065304417";
const MAP_COORDS = "7.492329,4.537698";

const INQUIRY_TYPE_OPTIONS = [
  { label: "Buy Property", value: "buying" },
  { label: "Sell Property", value: "selling" },
  { label: "Rent Property", value: "renting" },
  { label: "Property Management", value: "management" },
  { label: "Investment", value: "investment" },
  { label: "Others", value: "others" },
];

const SOURCE_OPTIONS = [
  { label: "Social Media", value: "social" },
  { label: "Google Search", value: "google" },
  { label: "Friend / Referral", value: "friend" },
  { label: "Online Ads", value: "ads" },
  { label: "Other", value: "other" },
];

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#703BF7] focus:ring-2 focus:ring-[#703BF7]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white";
const dropdownClass =
  "flex h-[46px] w-full cursor-pointer items-center justify-between rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 transition hover:border-[#703BF7] dark:border-white/15 dark:bg-[#101010] dark:text-white";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-900 dark:text-white";
const cardClass =
  "rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#1A1A1A] sm:p-8";
const infoCardClass =
  "group flex flex-col rounded-3xl border border-gray-200 bg-white p-6 transition duration-200 dark:border-white/10 dark:bg-[#1A1A1A]";
const infoCardLinkClass = "hover:-translate-y-0.5 hover:shadow-lg";
const pillLinkClass =
  "inline-flex items-center justify-center gap-3 rounded-full border border-gray-300 bg-gray-100 px-5 py-2.5 text-sm text-gray-900 transition hover:border-[#703BF7] hover:text-[#703BF7] dark:border-white/15 dark:bg-white/5 dark:text-white";

const Required = () => <span className="ml-1 text-red-600">*</span>;

function Contact() {
  const { isAuthenticated, customer } = useAuthStore();

  const [agreed, setAgreed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [source, setSource] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inquiryCookieKey = "rewaciti_contact_inquiry";
  const requestKey = useRequestKey();
  const cookieLoaded = useRef(false);

  useScrollToHash();

  useEffect(() => {
    const savedInquiry = getCookie(inquiryCookieKey);
    if (savedInquiry) {
      try {
        const parsed = JSON.parse(savedInquiry);
        setFirstName(parsed.firstName || "");
        setLastName(parsed.lastName || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
        setInquiryType(parsed.inquiryType || "");
        setSource(parsed.source || "");
        setMessage(parsed.message || "");
        setAgreed(parsed.agreed || false);
      } catch {
        // ignore malformed cookie data
      }
    }

    if (!isAuthenticated || !customer) {
      return;
    }

    const populateProfileDetails = async () => {
      try {
        const profileData = await authAPI.getProfile();
        const latestPhone = profileData.phoneNumber || "";
        setFirstName(customer.firstName || "");
        setLastName(customer.lastName || "");
        setEmail(customer.email || "");
        setPhone(latestPhone || customer.phoneNumber || "");

        const currentCustomer = useAuthStore.getState().customer;
        if (currentCustomer && currentCustomer.phoneNumber !== latestPhone) {
          useAuthStore.getState().setCustomer({
            ...currentCustomer,
            phoneNumber: latestPhone,
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile for contact form:", error);
      }
    };

    populateProfileDetails();
  }, [isAuthenticated, customer]);

  useEffect(() => {
    if (!cookieLoaded.current) {
      cookieLoaded.current = true;
      return;
    }

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      inquiryType,
      source,
      message,
      agreed,
    };

    setCookie(inquiryCookieKey, JSON.stringify(payload));
  }, [firstName, lastName, email, phone, inquiryType, source, message, agreed]);

  const canSubmit =
    agreed &&
    !isSubmitting &&
    !!firstName.trim() &&
    !!lastName.trim() &&
    !!email.trim() &&
    !!phone.trim() &&
    !!message.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !message.trim()
    ) {
      toast.error(
        "Please enter your full name, email, phone number and message to send a message.",
      );
      return;
    }

    setIsSubmitting(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const labelOf = (options: { label: string; value: string }[], value: string) =>
      options.find((option) => option.value === value)?.label ?? (value || undefined);

    try {
      const reply = await requestsAPI.contact(
        {
          name: fullName,
          email: email.trim(),
          phone: phone.trim(),
          consent: agreed,
          message: message.trim(),
          topic: labelOf(INQUIRY_TYPE_OPTIONS, inquiryType),
          heardFrom: labelOf(SOURCE_OPTIONS, source),
        },
        requestKey.current(),
      );
      requestKey.renew();
      noteTestMode(reply);
      toast.success(
        <div className="whitespace-pre-wrap">
          Message sent successfully!
          <br />A member of our team will get back to you soon.
        </div>,
      );
      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setInquiryType("");
      setSource("");
      setMessage("");
      setAgreed(false);
      setCookie(
        inquiryCookieKey,
        JSON.stringify({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          inquiryType: "",
          source: "",
          message: "",
          agreed: false,
        }),
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(errorMessage(error, "Failed to send message. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactCards = [
    {
      img: "/logo/servicecontainer/Icon Container (17).png",
      label: "Email us",
      text: EMAIL,
      href: `mailto:${EMAIL}`,
    },
    {
      img: "/logo/servicecontainer/Icon Container (16).png",
      label: "Call us",
      text: PHONE_DISPLAY,
      href: `tel:${PHONE_TEL}`,
    },
    {
      img: "/logo/servicecontainer/Icon Container (15).png",
      label: "Visit us",
      text: "Parakin, Ile-Ife",
      href: "#Ouroffices",
    },
    {
      img: "/logo/servicecontainer/Icon Container (14).png",
      label: "Follow us",
      text: "Social Media",
      href: undefined,
    },
  ];

  return (
    <div className="bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
      <Helmet>
        <title>Contact RewaCiti | Real Estate Support in Ile-Ife</title>
        <meta
          name="description"
          content="Get in touch with RewaCiti for property listings, student housing support, and real estate advisory services in Ile-Ife and Osun State."
        />
        <meta
          property="og:title"
          content="Contact RewaCiti | Real Estate Support in Ile-Ife"
        />
        <meta
          property="og:description"
          content="Contact RewaCiti to connect with our real estate experts, request property information, or book a housing consultation."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Contact RewaCiti | Real Estate Support"
        />
        <meta
          name="twitter:description"
          content="Reach out to RewaCiti for property, student housing, and investment support in Ile-Ife."
        />
        <link rel="canonical" href="https://rewaciti.com/contact" />
      </Helmet>
      <Navbar />

      {/* Quick contact cards */}
      <section
        id="Contactinfo"
        className="scroll-mt-24 bg-gray-200 pb-12 pt-10 dark:bg-black/50 sm:pb-16 sm:pt-14"
      >
        <div className={PAGE_CONTAINER}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {contactCards.map((item) => {
              const content = (
                <>
                  <img
                    src={item.img}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-12 object-contain"
                  />
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{item.label}</p>
                  <p
                    style={SERIF}
                    className="mt-1 wrap-break-words text-lg font-semibold leading-snug text-gray-900 dark:text-white"
                  >
                    {item.text}
                  </p>
                </>
              );
              return item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  className={`${infoCardClass} ${infoCardLinkClass}`}
                >
                  {content}
                </a>
              ) : (
                <div key={item.label} className={infoCardClass}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Form */}
      <section
        id="Contactform"
        className="scroll-mt-24 py-14 sm:py-20"
      >
        <div className={`${PAGE_CONTAINER} grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-12`}>
          <div className="h-fit lg:sticky lg:top-28">
            <p className="text-sm font-semibold text-[#703BF7] dark:text-[#b79bff]">
              Get in touch
            </p>
            <h1
              style={SERIF}
              className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl"
            >
              Let's connect
            </h1>
            <p className="mt-4 leading-7 text-gray-700 dark:text-gray-400">
              We're excited to connect with you and learn more about your real estate goals. Use
              the form to get in touch with RewaCiti. Whether you're a prospective client, partner,
              or simply curious about our services, we're here to answer your questions and
              provide the assistance you need.
            </p>
            <a
              href="#Ouroffices"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#703BF7] underline-offset-2 hover:underline dark:text-[#b79bff]"
            >
              <FiMapPin size={16} /> Find our office
            </a>
          </div>

          <form onSubmit={handleSubmit} className={`${cardClass} space-y-6`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="contact-first-name">
                  First name
                  <Required />
                </label>
                <input
                  id="contact-first-name"
                  type="text"
                  placeholder="Enter first name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="contact-last-name">
                  Last name
                  <Required />
                </label>
                <input
                  id="contact-last-name"
                  type="text"
                  placeholder="Enter last name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="contact-email">
                  Email
                  <Required />
                </label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="contact-phone">
                  Phone
                  <Required />
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  placeholder="0803 123 4567"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Inquiry type</label>
                <CustomDropdown
                  placeholder="Select inquiry type"
                  value={inquiryType}
                  options={INQUIRY_TYPE_OPTIONS}
                  onChange={(val) => setInquiryType(val)}
                  buttonClassName={dropdownClass}
                />
              </div>

              <div>
                <label className={labelClass}>How did you hear about us?</label>
                <CustomDropdown
                  placeholder="Select option"
                  value={source}
                  options={SOURCE_OPTIONS}
                  onChange={(val) => setSource(val)}
                  buttonClassName={dropdownClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="contact-message">
                Message
                <Required />
              </label>
              <textarea
                id="contact-message"
                rows={5}
                required
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${inputClass} resize-y`}
              />
            </div>

            <div className="space-y-5 border-t border-gray-200 pt-6 dark:border-white/10">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700 dark:text-gray-400">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-[#703BF7]"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                />
                <span>
                  I agree with the{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#703BF7] underline underline-offset-2 hover:text-[#9677df] dark:text-[#b79bff]"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#703BF7] underline underline-offset-2 hover:text-[#9677df] dark:text-[#b79bff]"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full cursor-pointer rounded-full bg-[#703BF7] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9677df] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isSubmitting ? "Sending..." : "Send your message"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Office */}
      <section
        id="Ouroffices"
        className="scroll-mt-24 bg-gray-200 py-14 dark:bg-black/50 sm:py-20"
      >
        <div className={PAGE_CONTAINER}>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#703BF7] dark:text-[#b79bff]">Our office</p>
            <h2
              style={SERIF}
              className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl"
            >
              Discover our office location
            </h2>
            <p className="mt-4 leading-7 text-gray-700 dark:text-gray-400">
              RewaCiti is here to serve you. Whether you're looking to meet our team, discuss real
              estate opportunities, or simply drop by for a chat, you're welcome at our office.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className={`${cardClass} flex flex-col`}>
              <h3 style={SERIF} className="text-2xl font-semibold text-gray-900 dark:text-white">
                Main Headquarters
              </h3>
              <p className="mt-2 text-gray-700 dark:text-gray-400">
                51, Ramon Adedoyin way, Parakin, Ile-Ife, Osun State, Nigeria
              </p>
              <p className="mt-4 text-sm leading-6 text-gray-700 dark:text-gray-300">
                Our main headquarters serve as the heart of RewaCiti. Located in the bustling city
                center, this is where our core team of experts operates, driving the excellence and
                innovation that define us.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href={`mailto:${EMAIL}`} className={pillLinkClass}>
                  <FaEnvelope />
                  <span>{EMAIL}</span>
                </a>
                <a href={`tel:${PHONE_TEL}`} className={pillLinkClass}>
                  <FaPhone />
                  <span>{PHONE_DISPLAY}</span>
                </a>
                <div className={`${pillLinkClass} hover:border-gray-300 hover:text-gray-900 dark:hover:text-white`}>
                  <FiMapPin />
                  <span>Parakin, Ile-Ife, Osun State</span>
                </div>
              </div>

              <a
                href={`https://maps.google.com/?q=${MAP_COORDS}&entry=gps&g_st=awb`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#703BF7] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9677df] sm:w-fit"
              >
                <FaDirections />
                Get directions
              </a>
            </div>

            <div className="min-h-80 overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1A1A1A]">
              <iframe
                title="RewaCiti office location"
                src={`https://www.google.com/maps?q=${MAP_COORDS}&z=16&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full min-h-80 w-full border-0"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Contact;