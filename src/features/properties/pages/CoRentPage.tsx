import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import Navbar from "../../../shared/components/Layout/Navbar";
import Footer from "../../../shared/components/Layout/Footer";
import { useAuthStore } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { getCookie, setCookie } from "../../../shared/lib/utils";
import { errorMessage, noteTestMode } from "../../../shared/lib/realEstateApi";
import useRequestKey from "../../../shared/hooks/useRequestKey";
import { requestsAPI, type CoRentRequest } from "../services/requestsAPI";
import CustomDropdown from "../components/CustomDropdown";

const PAGE_CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10";
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };
const inputClass =
  "h-[46px] w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#703BF7] focus:ring-2 focus:ring-[#703BF7]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white";
const labelClass = "mb-1.5 block text-xs font-medium text-gray-900 dark:text-gray-200";
const sectionLabelClass =
  "text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300";
const cardClass =
  "rounded-3xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#1A1A1A] sm:p-8";
const Required = () => <span className="text-red-600">*</span>;

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const PREFERRED_GENDER_OPTIONS = [
  { label: "Any / No Preference", value: "any" },
  { label: "Male Only", value: "male" },
  { label: "Female Only", value: "female" },
];

const ROOM_TYPE_OPTIONS = [
  { label: "Shared Room (2 in a room)", value: "Shared Room (2 in a room)" },
  { label: "Shared Apartment", value: "Shared Apartment" },
  { label: "Self Contain Share", value: "Self Contain Share" },
  { label: "2-Bedroom Flat Share", value: "2-Bedroom Flat Share" },
  { label: "3-Bedroom Flat Share", value: "3-Bedroom Flat Share" },
];

/** Only a shared room means sharing the room itself; the rest share a home. */
const sharingOf = (roomType: string): CoRentRequest["sharing"] =>
  !roomType ? undefined : roomType.startsWith("Shared Room") ? "shared_room" : "shared_apartment";

const digits = (value: string) => value.replace(/[^\d]/g, "");

const CoRentPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferedLocation, setPreferedLocation] = useState("");
  const [nearby, setNearby] = useState("");
  const [gender, setGender] = useState("");
  const [preferredPartnerGender, setPreferredPartnerGender] = useState("any");
  const [roomType, setRoomType] = useState("");
  const [budget, setBudget] = useState("");
  const [moveInTimeline, setMoveInTimeline] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const coRentCookieKey = "rewaciti_corent_request";
  const requestKey = useRequestKey();

  // Load saved draft from cookie once on mount only.
  useEffect(() => {
    const savedData = getCookie(coRentCookieKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
        setPreferedLocation(parsed.preferedLocation || "");
        setNearby(parsed.nearby || "");
        // Drafts saved before the form changed used capitalised values
        setGender((parsed.gender || "").toLowerCase());
        setPreferredPartnerGender((parsed.preferredPartnerGender || "any").toLowerCase());
        setRoomType(parsed.roomType || "");
        setBudget(digits(parsed.budget || ""));
        setMoveInTimeline(parsed.moveInTimeline || "");
        setMessage(parsed.message || "");
        setAgreed(parsed.agreed || false);
      } catch {
        // ignore malformed cookie
      }
    }
  }, []);

  // Populate contact details from the profile for signed-in users.
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
        console.error("Failed to fetch profile for co-rent form:", error);
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
      preferedLocation,
      nearby,
      gender,
      preferredPartnerGender,
      roomType,
      budget,
      moveInTimeline,
      message,
      agreed,
    };

    setCookie(coRentCookieKey, JSON.stringify(payload));
  }, [
    name,
    email,
    phone,
    preferedLocation,
    nearby,
    gender,
    preferredPartnerGender,
    roomType,
    budget,
    moveInTimeline,
    message,
    agreed,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim() || !preferedLocation.trim()) {
      toast.error("Please fill in your name, email, phone number, and preferred location.");
      return;
    }

    setIsSubmitting(true);

    try {
      // The team matches people asking for the same kind of place
      const reply = await requestsAPI.coRent(
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          consent: agreed,
          location: preferedLocation.trim(),
          nearby: nearby.trim() || undefined,
          gender: (gender || undefined) as CoRentRequest["gender"],
          partnerGender: preferredPartnerGender as CoRentRequest["partnerGender"],
          sharing: sharingOf(roomType),
          budgetPerPerson: budget ? Number(budget) : undefined,
          moveIn: moveInTimeline.trim() || undefined,
          message: [roomType && `Share type: ${roomType}`, message.trim()].filter(Boolean).join("\n\n") || undefined,
        },
        requestKey.current(),
      );
      requestKey.renew();
      noteTestMode(reply);
      toast.success(
        <div className="whitespace-pre-wrap">
          Co-rent request submitted successfully!
          <br />Our team will connect you with matching co-tenants soon.
        </div>
      );
      setName("");
      setEmail("");
      setPhone("");
      setPreferedLocation("");
      setNearby("");
      setGender("");
      setPreferredPartnerGender("any");
      setRoomType("");
      setBudget("");
      setMoveInTimeline("");
      setMessage("");
      setAgreed(false);
      setCookie(
        coRentCookieKey,
        JSON.stringify({
          name: "",
          email: "",
          phone: "",
          preferedLocation: "",
          nearby: "",
          gender: "",
          preferredPartnerGender: "any",
          roomType: "",
          budget: "",
          moveInTimeline: "",
          message: "",
          agreed: false,
        })
      );
    } catch (error) {
      console.error("Error submitting co-rent request:", error);
      toast.error(errorMessage(error, "Failed to submit co-rent request. Please try again."));
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
    Boolean(preferedLocation.trim());

  return (
    <div className="bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
      <Helmet>
        <title>Find a Co-Rent Partner | RewaCiti</title>
        <meta
          name="description"
          content="Tell RewaCiti where and how you want to share a home, and we’ll help connect you with a compatible co-rent partner."
        />
      </Helmet>
      <Navbar />
      <header className="border-b border-gray-300 bg-gray-200 py-7 dark:border-white/10 dark:bg-black/50 sm:py-8">
        <div className={`${PAGE_CONTAINER} max-w-7xl`}>
          <p className="text-sm font-semibold text-[#703BF7] dark:text-[#b79bff]">
            RewaCiti co-renting
          </p>
          <h1 style={SERIF} className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl">
            Find someone to share with
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-700 dark:text-gray-400">
            Split the rent with someone looking for the same kind of place. Tell us about you and
            we’ll help make the match.
          </p>
        </div>
      </header>

      <main className="bg-gray-300 py-8 dark:bg-black/30 sm:py-10">
        <div className={`${PAGE_CONTAINER} grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(200px,0.4fr)] lg:gap-8`}>
          <form onSubmit={handleSubmit} className={`${cardClass} space-y-5`}>
            <section className="space-y-4">
              <h2 className={sectionLabelClass}>Your details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="co-rent-name">
                    Full name <Required />
                  </label>
                  <input
                    id="co-rent-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="co-rent-email">
                    Email <Required />
                  </label>
                  <input
                    id="co-rent-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="co-rent-phone">
                    Phone <Required />
                  </label>
                  <input
                    id="co-rent-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Enter your phone number"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-gray-200 pt-5 dark:border-white/10">
              <h2 className={sectionLabelClass}>What you’re after</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="co-rent-location">
                    Where you’d like to live <Required />
                  </label>
                  <input
                    id="co-rent-location"
                    type="text"
                    placeholder="e.g. Asherefa, Ile-Ife"
                    required
                    value={preferedLocation}
                    onChange={(e) => setPreferedLocation(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="co-rent-nearby">
                    Near (school or landmark)
                  </label>
                  <input
                    id="co-rent-nearby"
                    type="text"
                    placeholder="e.g. OAU Teaching Hospital"
                    value={nearby}
                    onChange={(e) => setNearby(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>You are</label>
                  <CustomDropdown
                    placeholder="Prefer not to say"
                    value={gender}
                    options={[{ label: "Prefer not to say", value: "" }, ...GENDER_OPTIONS]}
                    onChange={setGender}
                    buttonClassName={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>You’d share with</label>
                  <CustomDropdown
                    placeholder="Anyone"
                    value={preferredPartnerGender}
                    options={PREFERRED_GENDER_OPTIONS}
                    onChange={setPreferredPartnerGender}
                    buttonClassName={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Sharing</label>
                  <CustomDropdown
                    placeholder="Choose a sharing type"
                    value={roomType}
                    options={ROOM_TYPE_OPTIONS}
                    onChange={setRoomType}
                    buttonClassName={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="co-rent-budget">
                    Your budget per person (₦)
                  </label>
                  <input
                    id="co-rent-budget"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 150,000"
                    value={budget ? Number(budget).toLocaleString() : ""}
                    onChange={(e) => setBudget(digits(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="co-rent-move-in">
                    When you’d move in
                  </label>
                  <input
                    id="co-rent-move-in"
                    type="text"
                    placeholder="e.g. January"
                    value={moveInTimeline}
                    onChange={(e) => setMoveInTimeline(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="co-rent-message">
                    A little about you
                  </label>
                  <textarea
                    id="co-rent-message"
                    rows={3}
                    placeholder="Student, quiet, early riser..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${inputClass} h-auto min-h-24 py-3`}
                  />
                </div>
              </div>
            </section>

            <div className="space-y-4 border-t border-gray-200 pt-5 dark:border-white/10">
              <label className="flex items-start gap-2 text-xs leading-5 text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  className="mt-1 accent-[#703BF7]"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                />
                <span>
                  I agree that my details can be used to reply to this request, and accept the{" "}
                  <Link to="/terms" target="_blank" rel="noreferrer" className="text-[#703BF7] underline dark:text-[#b79bff]">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#703BF7] underline dark:text-[#b79bff]">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              <button
                type="submit"
                disabled={!isFormValid}
                className="cursor-pointer rounded-full bg-[#703BF7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9677df] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Finding your match…" : "Find me a match"}
              </button>
            </div>
          </form>

          <aside className="rounded-3xl bg-gray-200 p-6 dark:bg-black/50 lg:sticky lg:top-28">
            <h2 style={SERIF} className="text-lg font-semibold text-gray-900 dark:text-white">
              Matched with care
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-400">
              We only introduce you to people looking for the same area, budget and kind of
              sharing, and you choose whether to go ahead.
            </p>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoRentPage;