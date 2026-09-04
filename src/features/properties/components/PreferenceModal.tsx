import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiSend, FiSliders } from "react-icons/fi";
import { Link } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import { COMPANY_ID, useAuthStore } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { getCookie, setCookie } from "../../../shared/lib/utils";
import CustomDropdown from "./CustomDropdown";

interface PreferenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: { label: string; value: string }[];
}

const DEFAULT_CATEGORIES = [
  { label: "None here", value: "none" },
  { label: "Self Contain", value: "Self Contain" },
  { label: "Studio Apartment", value: "Studio Apartment" },
  { label: "Mini Flat", value: "Mini Flat" },
  { label: "Flat", value: "Flat" },
  { label: "Bungalow", value: "Bungalow" },
  { label: "Duplex", value: "Duplex" },
  { label: "Mansion", value: "Mansion" },
  { label: "Villa", value: "Villa" },
  { label: "Smart Home", value: "Smart Home" },
  { label: "Single Room", value: "Single Room (Shared)" },
  { label: "Shared Room", value: "Shared Room" },
  { label: "Land", value: "Land" },
  { label: "Uncompleted Building", value: "Uncompleted Building" },
];

const DEFAULT_PRICE_OPTIONS = [
  { label: "All Price", value: "All Price" },
  { label: "Below ₦100k", value: "Below ₦100k" },
  { label: "₦100k - ₦200k", value: "₦100k - ₦200k" },
  { label: "₦200k - ₦300k", value: "₦200k - ₦300k" },
  { label: "₦300k - ₦400k", value: "₦300k - ₦400k" },
  { label: "₦400k - ₦500k", value: "₦400k - ₦500k" },
  { label: "₦500k - ₦700k", value: "₦500k - ₦700k" },
  { label: "₦700k - ₦1M", value: "₦700k - ₦1M" },
  { label: "Above ₦1M", value: "Above ₦1M" },
];

const CONTACT_METHOD_OPTIONS = [
  { label: "Phone", value: "Phone" },
  { label: "Email", value: "Email" },
];

const PreferenceModal: React.FC<PreferenceModalProps> = ({
  open,
  onOpenChange,
  categories = DEFAULT_CATEGORIES,
}) => {
  const { isAuthenticated, customer } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferedLocation, setPreferedLocation] = useState("");
  const [preferedCategory, setPreferedCategory] = useState("");
  const [bedroomsContact, setBedroomsContact] = useState("");
  const [budget, setBudget] = useState("");
  const [preferredContact, setPreferredContact] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const inquiryCookieKey = "rewaciti_property_inquiry";
  const cookieLoaded = useRef(false);

  useEffect(() => {
    const savedInquiry = getCookie(inquiryCookieKey);
    if (savedInquiry) {
      try {
        const parsed = JSON.parse(savedInquiry);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
        setPreferedLocation(parsed.preferedLocation || "");
        setPreferedCategory(parsed.preferedCategory || "");
        setBedroomsContact(parsed.bedroomsContact || "");
        setBudget(parsed.budget || "");
        setPreferredContact(parsed.preferredContact || "");
        setMessage(parsed.message || "");
        setAgreed(parsed.agreed || false);
      } catch {
        // ignore malformed cookie data
      }
    }

    if (open && isAuthenticated) {
      const populateProfileDetails = async () => {
        try {
          const profileData = await authAPI.getProfile();
          const latestPhone = profileData.phoneNumber || "";
          const nameFromCustomer = [customer?.firstName, customer?.lastName]
            .filter(Boolean)
            .join(" ");
          setName(nameFromCustomer);
          setEmail(customer?.email || "");
          setPhone(latestPhone || customer?.phoneNumber || "");

          const currentCustomer = useAuthStore.getState().customer;
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
    }
  }, [open, isAuthenticated, customer]);

  useEffect(() => {
    if (!cookieLoaded.current) {
      cookieLoaded.current = true;
      return;
    }

    const payload = {
      name,
      email,
      phone,
      preferedLocation,
      preferedCategory,
      bedroomsContact,
      budget,
      preferredContact,
      message,
      agreed,
    };

    setCookie(inquiryCookieKey, JSON.stringify(payload));
  }, [
    name,
    email,
    phone,
    preferedLocation,
    preferedCategory,
    bedroomsContact,
    budget,
    preferredContact,
    message,
    agreed,
  ]);

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
      !preferedLocation.trim()
    ) {
      toast.error(
        "Please enter your name, email, phone number, and preferred location to continue."
      );
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyId: COMPANY_ID,
      pipelineId: "69b49c7541d35d158e336621",
      title: `Property Inquiry from ${name.trim()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: preferedLocation.trim(),
      note: message || "No additional details added",
      customData: [
        { label: "Budget", value: budget },
        { label: "Category", value: preferedCategory },
        { label: "Preferred Location", value: preferedLocation.trim() },
        { label: "Bedrooms", value: bedroomsContact },
        { label: "Preferred Contact", value: preferredContact },
      ],
    };

    try {
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);
      toast.success(
        <div className="whitespace-pre-wrap">
          Message sent successfully!
          <br />A member of our team will get back to you soon.
        </div>
      );
      setName("");
      setEmail("");
      setPhone("");
      setPreferedLocation("");
      setPreferedCategory("");
      setBedroomsContact("");
      setBudget("");
      setPreferredContact("");
      setMessage("");
      setAgreed(false);
      setCookie(
        inquiryCookieKey,
        JSON.stringify({
          name: "",
          email: "",
          phone: "",
          preferedLocation: "",
          preferedCategory: "",
          bedroomsContact: "",
          budget: "",
          preferredContact: "",
          message: "",
          agreed: false,
        })
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
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
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs dialog-overlay-animate" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-2xl dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-5 md:p-6 rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto center-modal-animate">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div className="space-y-1 pr-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#703BF7]/10 text-[#703BF7]">
                  <FiSliders size={22} />
                </div>
                <Dialog.Title className="text-xl md:text-2xl font-bold dark:text-white text-gray-900">
                  Can't find your preference?
                </Dialog.Title>
              </div>
              <Dialog.Description className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Fill out the details below and our team will work to find your ideal property match.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600 cursor-pointer shrink-0"
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-[#703BF7] text-sm dark:placeholder-gray-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter your Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-[#703BF7] text-sm dark:placeholder-gray-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Enter Phone Number"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-[#703BF7] text-sm dark:placeholder-gray-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Preferred Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lekki Phase 1, Lagos"
                  required
                  value={preferedLocation}
                  onChange={(e) => setPreferedLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-[#703BF7] text-sm dark:placeholder-gray-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Category
                </label>
                <CustomDropdown
                  placeholder="Select Category"
                  value={preferedCategory}
                  options={categories}
                  onChange={(val) => setPreferedCategory(val)}
                  buttonClassName="w-full h-10.5 px-3.5 flex items-center justify-between rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm focus:border-[#703BF7]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  No of Bedrooms
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 or Shared"
                  value={bedroomsContact}
                  onChange={(e) => setBedroomsContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-[#703BF7] text-sm dark:placeholder-gray-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Budget
                </label>
                <CustomDropdown
                  placeholder="Select Budget Range"
                  value={budget}
                  options={DEFAULT_PRICE_OPTIONS}
                  onChange={(val) => setBudget(val)}
                  buttonClassName="w-full h-10.5 px-3.5 flex items-center justify-between rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm focus:border-[#703BF7]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Preferred Contact Method
                </label>
                <CustomDropdown
                  placeholder="Select Method"
                  value={preferredContact}
                  options={CONTACT_METHOD_OPTIONS}
                  onChange={(val) => setPreferredContact(val)}
                  buttonClassName="w-full h-10.5 px-3.5 flex items-center justify-between rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm focus:border-[#703BF7]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                Describe What You Want
              </label>
              <textarea
                placeholder="Describe your ideal property, desired amenities, move-in timeline, or any special requests..."
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-[#703BF7] text-sm resize-none dark:placeholder-gray-500 placeholder-gray-400"
              />
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="modal-agree-terms"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-400 accent-[#703BF7] cursor-pointer"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <label htmlFor="modal-agree-terms" className="text-xs md:text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-snug">
                I agree with the{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#703BF7] underline hover:text-[#5c2fe0]"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#703BF7] underline hover:text-[#5c2fe0]"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition shadow-md ${
                  isFormValid
                    ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white cursor-pointer active:scale-[0.99]"
                    : "bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending Preference...</span>
                  </>
                ) : (
                  <>
                    <FiSend size={16} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PreferenceModal;
