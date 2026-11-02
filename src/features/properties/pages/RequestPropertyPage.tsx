import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import Navbar from "../../../shared/components/Layout/Navbar";
import Footer from "../../../shared/components/Layout/Footer";
import { errorMessage, noteTestMode } from "../../../shared/lib/realEstateApi";
import { getCookie, setCookie } from "../../../shared/lib/utils";
import useRequestKey from "../../../shared/hooks/useRequestKey";
import { usePropertyStore } from "../store/usePropertyStore";
import { requestsAPI } from "../services/requestsAPI";
import { PURPOSE_LABELS } from "../services/toProperty";
import CustomDropdown from "../components/CustomDropdown";

// Same container as the Navbar, PropertyDetails and AccountPage.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Same serif as the Navbar / Home hero (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

const PURPOSE_OPTIONS = [
  { label: "Rent or buy", value: "" },
  ...Object.entries(PURPOSE_LABELS).map(([value, label]) => ({ label, value })),
];
const digits = (value: string) => value.replace(/[^\d]/g, "");

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#703BF7] focus:ring-2 focus:ring-[#703BF7]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white";
const dropdownClass =
  "flex h-[46px] w-full cursor-pointer items-center justify-between rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 transition hover:border-[#703BF7] dark:border-white/15 dark:bg-[#101010] dark:text-white";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-900 dark:text-white";
const sectionTitleClass = "mb-4 text-xl font-semibold text-gray-900 dark:text-white";
const cardClass =
  "rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#1A1A1A] sm:p-8";
const fieldClass = "min-w-0";
const cookieKey = "rewaciti_property_inquiry";

const RequestPropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { locations, fetchLocations, categories, fetchCategories } = usePropertyStore();
  const requestKey = useRequestKey();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [nearby, setNearby] = useState("");
  const [category, setCategory] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const typeOptions = useMemo(
    () => [
      { label: "Any type", value: "" },
      ...categories.map(({ id, name }) => ({ label: name, value: id })),
    ],
    [categories],
  );
  const cities = useMemo(
    () => locations.flatMap(({ state, cities }) => cities.map(({ city }) => ({ city, state }))),
    [locations],
  );
  const landmarks = useMemo(
    () =>
      [
        ...new Set(
          locations.flatMap(({ cities }) =>
            cities.flatMap((city) => city.nearby.map((item) => item.name)),
          ),
        ),
      ].sort(),
    [locations],
  );
  const selectedCategory = categories.find((item) => item.id === category);
  const normalizedCategory = (selectedCategory?.name ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const roomCountsDisabled =
    normalizedCategory === "selfcontain" ||
    normalizedCategory.startsWith("singleroom") ||
    normalizedCategory.startsWith("land");

  useEffect(() => {
    void fetchLocations();
    void fetchCategories();
  }, [fetchCategories, fetchLocations]);

  useEffect(() => {
    const saved = getCookie(cookieKey);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      setName(draft.name || "");
      setEmail(draft.email || "");
      setPhone(draft.phone || "");
      setPurpose(draft.purpose || "");
      setPreferredCity(draft.preferredCity || draft.preferedLocation || "");
      setNearby(draft.nearby || "");
      setCategory(draft.preferedCategory || "");
      setBedrooms(digits(draft.bedroomsContact || ""));
      setMaxBudget(digits(draft.maxBudget || ""));
      setMoveIn(draft.moveInTimeline || "");
      setMessage(draft.message || "");
      setAgreed(Boolean(draft.agreed));
    } catch (error) {
      console.error("Could not read the saved property request:", error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const populateProfile = async () => {
      try {
        const profile = await authAPI.getProfile();
        if (!active) return;
        const customer = useAuthStore.getState().customer;
        setName([customer?.firstName, customer?.lastName].filter(Boolean).join(" "));
        setEmail(customer?.email || profile.email || "");
        setPhone(profile.phoneNumber || customer?.phoneNumber || "");
        if (customer && customer.phoneNumber !== profile.phoneNumber) {
          useAuthStore.getState().setCustomer({
            ...customer,
            phoneNumber: profile.phoneNumber || "",
          });
        }
      } catch (error) {
        console.error("Failed to load profile details for property request:", error);
        toast.error(errorMessage(error, "Couldn't prefill your account details."));
      }
    };
    void populateProfile();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCookie(
      cookieKey,
      JSON.stringify({
        name,
        email,
        phone,
        purpose,
        preferredCity,
        nearby,
        preferedCategory: category,
        bedroomsContact: bedrooms,
        maxBudget,
        moveInTimeline: moveIn,
        message,
        agreed,
      }),
    );
  }, [name, email, phone, purpose, preferredCity, nearby, category, bedrooms, maxBudget, moveIn, message, agreed]);

  useEffect(() => {
    if (roomCountsDisabled) setBedrooms("");
  }, [roomCountsDisabled]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy.");
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim() || !preferredCity.trim()) {
      toast.error("Please enter your name, email, phone number, and preferred city.");
      return;
    }

    const city = preferredCity.trim();
    const knownCity = cities.find((item) => item.city.toLowerCase() === city.toLowerCase());
    setIsSubmitting(true);
    try {
      const reply = await requestsAPI.propertyRequest(
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          consent: agreed,
          purpose: purpose || undefined,
          typeId: category || undefined,
          state: knownCity?.state,
          city: knownCity?.city ?? city,
          nearby: nearby.trim() || undefined,
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          maxBudget: maxBudget ? Number(maxBudget) : undefined,
          moveIn: moveIn.trim() || undefined,
          message: message.trim() || undefined,
        },
        requestKey.current(),
      );
      requestKey.renew();
      noteTestMode(reply);
      toast.success("Request sent. We'll email you when a property that fits becomes available.");
      setCookie(cookieKey, "");
      navigate("/properties");
    } catch (error) {
      console.error("Failed to send property request:", error);
      toast.error(errorMessage(error, "Couldn't send your request. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
      <Navbar />

      <header className="bg-linear-to-r dark:from-neutral-600/20 from-gray-300/50 dark:to-black/60 to-gray-400 py-5">
        <div className={`${PAGE_CONTAINER} space-y-1`}>
          <h1 className="text-3xl text-gray-900 dark:text-white md:text-4xl">
            Request a property
          </h1>
          <p className="max-w-[95%] text-[14px] text-gray-800 dark:text-gray-400">
            Tell us what you're looking for. We'll search for you and email you the moment a
            listing fits.
          </p>
        </div>
      </header>
      <main
        className="bg-gray-200 py-8 dark:bg-black/50 sm:py-10"
      >
        <div className={`${PAGE_CONTAINER} grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10`}>
        <form onSubmit={handleSubmit} className={`${cardClass} space-y-8`}>
          <section>
            <h2 style={SERIF} className={sectionTitleClass}>
              Your details
            </h2>
            <div className="space-y-4">
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="request-name">
                  Full name <span className="text-red-600">*</span>
                </label>
                <input
                  id="request-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={fieldClass}>
                  <label className={labelClass} htmlFor="request-email">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="request-email"
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className={fieldClass}>
                  <label className={labelClass} htmlFor="request-phone">
                    Phone <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="request-phone"
                    required
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0803 123 4567"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-200 pt-8 dark:border-white/10">
            <h2 style={SERIF} className={sectionTitleClass}>
              What you're looking for
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={fieldClass}>
                <label className={labelClass}>Looking to</label>
                <CustomDropdown
                  placeholder="Rent or buy"
                  value={purpose}
                  options={PURPOSE_OPTIONS}
                  onChange={setPurpose}
                  buttonClassName={dropdownClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>Type of property</label>
                <CustomDropdown
                  placeholder="Any type"
                  value={category}
                  options={typeOptions}
                  onChange={setCategory}
                  buttonClassName={dropdownClass}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="request-city">
                  City or town <span className="text-red-600">*</span>
                </label>
                <input
                  id="request-city"
                  required
                  list="request-cities"
                  value={preferredCity}
                  onChange={(event) => setPreferredCity(event.target.value)}
                  placeholder="e.g. Ile-Ife"
                  className={inputClass}
                />
                <datalist id="request-cities">
                  {cities.map(({ city, state }) => (
                    <option key={`${state}-${city}`} value={city} />
                  ))}
                </datalist>
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="request-nearby">
                  Near (school or landmark)
                </label>
                <input
                  id="request-nearby"
                  list="request-landmarks"
                  value={nearby}
                  onChange={(event) => setNearby(event.target.value)}
                  placeholder="e.g. the university"
                  className={inputClass}
                />
                <datalist id="request-landmarks">
                  {landmarks.map((landmark) => (
                    <option key={landmark} value={landmark} />
                  ))}
                </datalist>
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="request-bedrooms">
                  Bedrooms
                </label>
                <input
                  id="request-bedrooms"
                  inputMode="numeric"
                  value={bedrooms}
                  onChange={(event) => setBedrooms(digits(event.target.value))}
                  placeholder={roomCountsDisabled ? "Not applicable" : "Any"}
                  disabled={roomCountsDisabled}
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass} htmlFor="request-budget">
                  Most you'd pay (₦)
                </label>
                <input
                  id="request-budget"
                  inputMode="numeric"
                  value={maxBudget ? Number(maxBudget).toLocaleString() : ""}
                  onChange={(event) => setMaxBudget(digits(event.target.value))}
                  placeholder="e.g. 500,000"
                  className={inputClass}
                />
              </div>
              <div className={`${fieldClass} sm:col-span-2`}>
                <label className={labelClass} htmlFor="request-move-in">
                  When you'd move in
                </label>
                <input
                  id="request-move-in"
                  value={moveIn}
                  onChange={(event) => setMoveIn(event.target.value)}
                  placeholder="e.g. January"
                  className={inputClass}
                />
              </div>
              <div className={`${fieldClass} sm:col-span-2`}>
                <label className={labelClass} htmlFor="request-notes">
                  Anything else?
                </label>
                <textarea
                  id="request-notes"
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ground floor, steady water, quiet street..."
                  className={`${inputClass} resize-y`}
                />
              </div>
            </div>
          </section>

          <div className="space-y-5 border-t border-gray-200 pt-8 dark:border-white/10">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700 dark:text-gray-400">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                required
                className="mt-0.5 h-4 w-4 cursor-pointer accent-[#703BF7]"
              />
              <span>
                I agree that my details can be used to reply to this request. Read our{" "}
                <Link
                  to="/privacy-policy"
                  className="font-semibold text-[#703BF7] underline underline-offset-2 hover:text-[#9677df] dark:text-[#b79bff]"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            <button
              type="submit"
              disabled={!agreed || isSubmitting}
              className="w-full cursor-pointer rounded-full bg-[#703BF7] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9677df] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSubmitting ? "Sending request…" : "Send my request"}
            </button>
          </div>
        </form>

        <aside className="h-fit space-y-4 lg:sticky lg:top-28">
          <section className={cardClass}>
            <h2 style={SERIF} className="text-lg font-semibold">
              How it works
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-400">
              We match new listings against your request every day, and email you the ones that
              fit your area and budget.
            </p>
          </section>
          <section className={cardClass}>
            <h2 style={SERIF} className="text-lg font-semibold">
              The more you tell us
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-400">
              A budget and the nearest school or landmark help us find a place faster.
            </p>
          </section>
        </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RequestPropertyPage;