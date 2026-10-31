import React, { useState, useEffect, useMemo, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX } from "react-icons/fi";
import { Link } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { getCookie, setCookie } from "../../../shared/lib/utils";
import { errorMessage, noteTestMode } from "../../../shared/lib/realEstateApi";
import useRequestKey from "../../../shared/hooks/useRequestKey";
import { usePropertyStore } from "../store/usePropertyStore";
import { requestsAPI } from "../services/requestsAPI";
import { PURPOSE_LABELS } from "../services/toProperty";
import CustomDropdown from "./CustomDropdown";

interface PreferenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Property types, with their ids as values. */
  categories: { label: string; value: string }[];
}

const PURPOSE_OPTIONS = Object.entries(PURPOSE_LABELS).map(([value, label]) => ({ label, value }));

const digits = (value: string) => value.replace(/[^\d]/g, "");

const PreferenceModal: React.FC<PreferenceModalProps> = ({
  open,
  onOpenChange,
  categories,
}) => {
  const { isAuthenticated } = useAuthStore();
  const { locations, fetchLocations } = usePropertyStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestKey = useRequestKey();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [nearby, setNearby] = useState("");
  const [preferedCategory, setPreferedCategory] = useState("");
  const [bedroomsContact, setBedroomsContact] = useState("");
  const [bathroomsContact, setBathroomsContact] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [moveInTimeline, setMoveInTimeline] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const selectedCategory = categories.find(
    (category) => category.value === preferedCategory,
  );
  const normalizedCategory = (selectedCategory?.label ?? preferedCategory)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const roomCountsDisabled =
    normalizedCategory === "selfcontain" ||
    normalizedCategory.startsWith("singleroom") ||
    normalizedCategory.startsWith("land");

  // Places with listings, offered as suggestions. Anywhere else can still be typed.
  const cities = useMemo(
    () => locations.flatMap(({ state, cities }) => cities.map(({ city }) => ({ city, state }))),
    [locations],
  );
  const landmarks = useMemo(
    () => [...new Set(locations.flatMap(({ cities }) => cities.flatMap((c) => c.nearby.map((n) => n.name))))].sort(),
    [locations],
  );

  const inquiryCookieKey = "rewaciti_property_inquiry";

  useEffect(() => {
    if (open) void fetchLocations();
  }, [open, fetchLocations]);

  useEffect(() => {
    if (roomCountsDisabled) {
      setBedroomsContact("");
      setBathroomsContact("");
    }
  }, [roomCountsDisabled]);

  // Load saved draft from cookie once on mount only.
  useEffect(() => {
    const savedInquiry = getCookie(inquiryCookieKey);
    if (savedInquiry) {
      try {
        const parsed = JSON.parse(savedInquiry);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
        setPurpose(parsed.purpose || "");
        // Drafts saved before the form changed kept the location as `preferedLocation`
        setPreferredCity(parsed.preferredCity || parsed.preferedLocation || "");
        setNearby(parsed.nearby || "");
        setPreferedCategory(parsed.preferedCategory || "");
        setBedroomsContact(digits(parsed.bedroomsContact || ""));
        setBathroomsContact(digits(parsed.bathroomsContact || ""));
        setMaxBudget(digits(parsed.maxBudget || ""));
        setMoveInTimeline(parsed.moveInTimeline || "");
        setMessage(parsed.message || "");
        setAgreed(parsed.agreed || false);
      } catch {
        // ignore malformed cookie data
      }
    }
  }, []);

  // Populate from authenticated profile only when the modal opens while logged in.
  useEffect(() => {
    if (!(open && isAuthenticated)) return;

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
        console.error("Failed to fetch profile for preference form:", error);
      }
    };

    populateProfileDetails();
  }, [open, isAuthenticated]);

  // Persist draft to cookie whenever fields change (skip the very first render).
  const isFirstRender = useRef(true);
  const draft = {
    name,
    email,
    phone,
    purpose,
    preferredCity,
    nearby,
    preferedCategory,
    bedroomsContact,
    bathroomsContact,
    maxBudget,
    moveInTimeline,
    message,
    agreed,
  };
  const draftJson = JSON.stringify(draft);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setCookie(inquiryCookieKey, draftJson);
  }, [draftJson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !preferredCity.trim()
    ) {
      toast.error(
        "Please enter your name, email, phone number, and preferred city to continue."
      );
      return;
    }

    setIsSubmitting(true);

    // A known city brings its state, so new listings there can be matched
    const city = preferredCity.trim();
    const known = cities.find((c) => c.city.toLowerCase() === city.toLowerCase());
    const toNumber = (value: string) => (value ? Number(value) : undefined);

    try {
      const reply = await requestsAPI.propertyRequest(
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          consent: agreed,
          purpose: purpose || undefined,
          typeId: preferedCategory || undefined,
          state: known?.state,
          city: known?.city ?? city,
          nearby: nearby.trim() || undefined,
          bedrooms: toNumber(bedroomsContact),
          bathrooms: toNumber(bathroomsContact),
          maxBudget: toNumber(maxBudget),
          moveIn: moveInTimeline.trim() || undefined,
          message: message.trim() || undefined,
        },
        requestKey.current(),
      );
      requestKey.renew();
      noteTestMode(reply);
      toast.success(
        <div className="whitespace-pre-wrap">
          Preference sent successfully!
          <br />We'll email you when a property that fits comes up.
        </div>
      );
      setPurpose("");
      setPreferredCity("");
      setNearby("");
      setPreferedCategory("");
      setBedroomsContact("");
      setBathroomsContact("");
      setMaxBudget("");
      setMoveInTimeline("");
      setMessage("");
      setAgreed(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(errorMessage(error, "Failed to send message. Please try again."));
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
    Boolean(preferredCity.trim());

  const inputClass =
    "w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white";
  const dropdownClass =
    "w-full h-[42px] px-4 flex items-center justify-between rounded-md dark:bg-black/70 bg-gray-300 border border-gray-600/70 text-gray-900 dark:text-white text-sm";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs dialog-overlay-animate" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-3 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto center-modal-animate">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-2xl font-semibold dark:text-white text-gray-900">
              Can't find preference?
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Tell us what you're looking for, and we'll email you when a property that fits comes up.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600 cursor-pointer">
                <FiX size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <section className="space-y-4 rounded-xl border border-gray-600/30 p-4 dark:bg-[#121212] bg-white">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                User Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Full Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter Phone Number"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-gray-600/30 p-4 dark:bg-[#121212] bg-white">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Property Preferences
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                    Looking To
                  </label>
                  <CustomDropdown
                    placeholder="Rent, buy..."
                    value={purpose}
                    options={PURPOSE_OPTIONS}
                    onChange={(val) => setPurpose(val)}
                    buttonClassName={dropdownClass}
                  />
                </div>

                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                    Category
                  </label>
                  <CustomDropdown
                    placeholder="Select Category"
                    value={preferedCategory}
                    options={categories}
                    onChange={(val) => setPreferedCategory(val)}
                    buttonClassName={dropdownClass}
                  />
                </div>

                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                    Preferred City / Town
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ile-Ife"
                    required
                    list="preference-cities"
                    value={preferredCity}
                    onChange={(e) => setPreferredCity(e.target.value)}
                    className={inputClass}
                  />
                  <datalist id="preference-cities">
                    {cities.map(({ city, state }) => (
                      <option key={`${state}-${city}`} value={city}>
                        {state}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                    Nearest University or Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OAU"
                    list="preference-landmarks"
                    value={nearby}
                    onChange={(e) => setNearby(e.target.value)}
                    className={inputClass}
                  />
                  <datalist id="preference-landmarks">
                    {landmarks.map((landmark) => (
                      <option key={landmark} value={landmark} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                    No of Bedrooms
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={roomCountsDisabled ? "Not applicable" : "Enter number of bedrooms"}
                    value={bedroomsContact}
                    onChange={(e) => setBedroomsContact(digits(e.target.value))}
                    disabled={roomCountsDisabled}
                    className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
                  />
                </div>

                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                    No of Bathrooms
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={roomCountsDisabled ? "Not applicable" : "Enter number of bathrooms"}
                    value={bathroomsContact}
                    onChange={(e) => setBathroomsContact(digits(e.target.value))}
                    disabled={roomCountsDisabled}
                    className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
                  />
                </div>

                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                    Maximum Budget (₦)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 350,000"
                    value={maxBudget ? Number(maxBudget).toLocaleString() : ""}
                    onChange={(e) => setMaxBudget(digits(e.target.value))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                    Move-in Timeline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. January"
                    value={moveInTimeline}
                    onChange={(e) => setMoveInTimeline(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-gray-600/30 p-4 dark:bg-[#121212] bg-white">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Additional Information
              </h3>
              <textarea
                rows={3}
                placeholder="Describe your ideal property, desired amenities, or any special requests..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={inputClass}
              />
            </section>

            <div className="sm:col-span-2 flex items-center gap-1">
              <input
                type="checkbox"
                className="mt-0.5"
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

            <div className="sm:col-span-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={!isFormValid}
                className={`px-4 py-3 rounded-lg font-medium transition
                  ${isFormValid
                    ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white"
                    : "bg-gray-400 cursor-not-allowed text-gray-200"
                  }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Preference"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PreferenceModal;
