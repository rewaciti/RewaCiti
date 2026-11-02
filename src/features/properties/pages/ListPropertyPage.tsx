import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { getCookie, setCookie } from "../../../shared/lib/utils";
import { errorMessage, noteTestMode } from "../../../shared/lib/realEstateApi";
import useRequestKey from "../../../shared/hooks/useRequestKey";
import { requestsAPI } from "../services/requestsAPI";
import CustomDropdown from "../components/CustomDropdown";
import Navbar from "../../../shared/components/Layout/Navbar";
import Footer from "../../../shared/components/Layout/Footer";
import { FiCheckCircle, FiClock, FiShield } from "react-icons/fi";

const LISTER_ROLE_OPTIONS = [
  { label: "Real Estate Agent / Broker", value: "Real Estate Agent" },
  { label: "Property Owner / Landlord", value: "Property Owner / Landlord" },
  { label: "Caretaker / Facility Manager", value: "Caretaker" },
  { label: "Property Developer / Builder", value: "Developer" },
  { label: "Other", value: "Other" },
];

const LISTING_PURPOSE_OPTIONS = [
  { label: "For rent", value: "rent" },
  { label: "For sale", value: "sale" },
  { label: "Short-let", value: "short-let" },
  { label: "For lease", value: "lease" },
  { label: "Investment", value: "investment" },
  { label: "Other", value: "other" },
];

const ListPropertyPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [listerRole, setListerRole] = useState("Real Estate Agent");
  const [listingPurpose, setListingPurpose] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const cookieKey = "rewaciti_become_lister_inquiry";
  const requestKey = useRequestKey();

  // Load saved draft from cookie once on mount only.
  useEffect(() => {
    const savedData = getCookie(cookieKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
        setListerRole(parsed.listerRole || "Real Estate Agent");
        setListingPurpose(parsed.listingPurpose || "");
        setLocation(parsed.location || "");
        setMessage(parsed.message || "");
        setAgreed(parsed.agreed || false);
      } catch {
        // ignore malformed cookie data
      }
    }
  }, []);

  // Populate authenticated applicants from their profile.
  useEffect(() => {
    if (!isAuthenticated) return;

    const populateProfileDetails = async () => {
      try {
        const profileData = await authAPI.getProfile();
        const latestPhone = profileData.phoneNumber || "";
        const currentCustomer = useAuthStore.getState().customer;

        const nameFromCustomer = [currentCustomer?.firstName, currentCustomer?.lastName]
          .filter(Boolean)
          .join(" ");
        setName(nameFromCustomer);
        setEmail(currentCustomer?.email || "");
        setPhone(latestPhone || currentCustomer?.phoneNumber || "");

        if (currentCustomer && currentCustomer.phoneNumber !== latestPhone) {
          useAuthStore.getState().setCustomer({
            ...currentCustomer,
            phoneNumber: latestPhone,
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile for become a lister form:", error);
      }
    };

    populateProfileDetails();
  }, [isAuthenticated]);

  // Persist draft to cookie whenever fields change (skip the very first render).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const payload = {
      name,
      email,
      phone,
      listerRole,
      listingPurpose,
      location,
      message,
      agreed,
    };

    setCookie(cookieKey, JSON.stringify(payload));
  }, [name, email, phone, listerRole, listingPurpose, location, message, agreed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim() || !location.trim()) {
      toast.error("Please enter your name, email, phone number, and location to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Approving it in SabiFlow invites them to the agent portal
      const reply = await requestsAPI.agentApplication(
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          consent: agreed,
          role: LISTER_ROLE_OPTIONS.find((option) => option.value === listerRole)?.label ?? listerRole,
          location: location.trim(),
          message: [
            `Listing purpose: ${LISTING_PURPOSE_OPTIONS.find((option) => option.value === listingPurpose)?.label ?? listingPurpose}`,
            message.trim(),
          ].filter(Boolean).join("\n\n"),
        },
        requestKey.current(),
      );
      requestKey.renew();
      noteTestMode(reply);
      toast.success(
        <div className="whitespace-pre-wrap">
          Lister request submitted successfully!
          <br />A member of our team will contact you shortly to verify your profile.
        </div>
      );

      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setListerRole("Real Estate Agent");
      setListingPurpose("");
      setLocation("");
      setMessage("");
      setAgreed(false);
      setCookie(
        cookieKey,
        JSON.stringify({
          name: "",
          email: "",
          phone: "",
          listerRole: "Real Estate Agent",
          listingPurpose: "",
          location: "",
          message: "",
          agreed: false,
        })
      );
    } catch (error) {
      console.error("Error submitting lister request:", error);
      toast.error(errorMessage(error, "Failed to submit request. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    agreed &&
    !isSubmitting &&
    Boolean(name.trim()) &&
    Boolean(email.trim()) &&
    Boolean(phone.trim()) &&
    Boolean(listingPurpose) &&
    Boolean(location.trim());

  return (
    <div className="min-h-screen bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
      <Navbar />
      <header className="bg-linear-to-r dark:from-neutral-600/20 from-gray-300/50 dark:to-black/60 to-gray-400 py-5">
        <div className="mx-auto w-full max-w-7xl space-y-1 px-4 sm:px-6 lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#703BF7] dark:text-[#b79bff]">
            List with RewaCiti
          </p>
          <h1 className="text-3xl text-gray-900 dark:text-white md:text-4xl">
            Put your property in good hands
          </h1>
          <p className="max-w-[95%] text-[14px] text-gray-800 dark:text-gray-400">
            Tell us a little about yourself and the properties you want to list. Our team will be in touch to verify your profile and help you get started.
          </p>
        </div>
      </header>
      <main className="bg-gray-200 py-10 dark:bg-black/50 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1A1A1A] sm:p-8">
            <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
              Your application
            </h2>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Fields marked as required help us verify your listing request.
            </p>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#703BF7] focus:outline-none dark:border-white/15 dark:bg-black/30 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#703BF7] focus:outline-none dark:border-white/15 dark:bg-black/30 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="Enter Phone Number"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#703BF7] focus:outline-none dark:border-white/15 dark:bg-black/30 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                  I am a...
                </label>
                <CustomDropdown
                  placeholder="Select Lister Role"
                  value={listerRole}
                  options={LISTER_ROLE_OPTIONS}
                  onChange={(val) => setListerRole(val)}
                  buttonClassName="w-full h-[46px] rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 dark:border-white/15 dark:bg-black/30 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                  What are you listing for?
                </label>
                <CustomDropdown
                  placeholder="Choose a listing purpose"
                  value={listingPurpose}
                  options={LISTING_PURPOSE_OPTIONS}
                  onChange={setListingPurpose}
                  buttonClassName="w-full h-[46px] rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 dark:border-white/15 dark:bg-black/30 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                  Primary Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mayfair, Ede Road, Ile-Ife"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#703BF7] focus:outline-none dark:border-white/15 dark:bg-black/30 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                About You
              </label>
              <textarea
                rows={4}
                placeholder="Tell us a bit about yourself and your experience as a lister."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#703BF7] focus:outline-none dark:border-white/15 dark:bg-black/30 dark:text-white"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1 accent-[#703BF7]"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                I agree with the{" "}
                <Link to="/terms" target="_blank" rel="noreferrer" className="text-[#703BF7] underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#703BF7] underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => navigate("/properties")}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                Back to properties
              </button>
              <button
                type="submit"
                disabled={!isFormValid}
                className={`rounded-lg px-5 py-3 text-sm font-semibold transition
                  ${isFormValid
                    ? "bg-[#703BF7] text-white hover:bg-[#5c2fe0]"
                    : "cursor-not-allowed bg-gray-400 text-gray-200"
                  }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1A1A1A]">
              <h2 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">
                Why list with us?
              </h2>
              <ul className="space-y-5">
                <li className="flex gap-3">
                  <FiCheckCircle className="mt-0.5 shrink-0 text-[#703BF7]" size={20} />
                  <span className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                    Reach tenants, buyers, and professionals looking for their next property.
                  </span>
                </li>
                <li className="flex gap-3">
                  <FiShield className="mt-0.5 shrink-0 text-[#703BF7]" size={20} />
                  <span className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                    Our team verifies your details before helping you publish.
                  </span>
                </li>
                <li className="flex gap-3">
                  <FiClock className="mt-0.5 shrink-0 text-[#703BF7]" size={20} />
                  <span className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                    After you apply, a team member will contact you shortly.
                  </span>
                </li>
              </ul>
            </div>
          </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ListPropertyPage;