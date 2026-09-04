import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX } from "react-icons/fi";
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

const PreferenceModal: React.FC<PreferenceModalProps> = ({
  open,
  onOpenChange,
  categories = DEFAULT_CATEGORIES,
}) => {
  const { isAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferedLocation, setPreferedLocation] = useState("");
  const [preferedCategory, setPreferedCategory] = useState("");
  const [bedroomsContact, setBedroomsContact] = useState("");
  const [bathroomsContact, setBathroomsContact] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const inquiryCookieKey = "rewaciti_property_inquiry";

  // Load saved draft from cookie once on mount only.
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
        setBathroomsContact(parsed.bathroomsContact || "");
        setBudget(parsed.budget || "");
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
      preferedCategory,
      bedroomsContact,
      bathroomsContact,
      budget,
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
    bathroomsContact,
    budget,
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
      title: `Property Preference from ${name.trim()}`,
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
        { label: "Bathrooms", value: bathroomsContact },
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
      setBathroomsContact("");
      setBudget("");
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
          bathroomsContact: "",
          budget: "",
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
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-3 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto center-modal-animate">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-2xl font-semibold dark:text-white text-gray-900">
              Can't find preference?
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600 cursor-pointer">
                <FiX size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 border border-gray-600/30 p-2 rounded-xl dark:bg-[#121212] bg-white"
          >
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
                  className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
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
                  className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
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
                  className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                  Preferred Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lekki Phase 1, Lagos"
                  required
                  value={preferedLocation}
                  onChange={(e) => setPreferedLocation(e.target.value)}
                  className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
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
                  buttonClassName="w-full h-[42px] px-4 flex items-center justify-between rounded-md dark:bg-black/70 bg-gray-300 border border-gray-600/70 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                  No of Bedrooms
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 or Shared"
                  value={bedroomsContact}
                  onChange={(e) => setBedroomsContact(e.target.value)}
                  className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                  No of Bathrooms
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 or 2"
                  value={bathroomsContact}
                  onChange={(e) => setBathroomsContact(e.target.value)}
                  className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                  Budget
                </label>
                <CustomDropdown
                  placeholder="Select Budget Range"
                  value={budget}
                  options={DEFAULT_PRICE_OPTIONS}
                  onChange={(val) => setBudget(val)}
                  buttonClassName="w-full h-[42px] px-4 flex items-center justify-between rounded-md dark:bg-black/70 bg-gray-300 border border-gray-600/70 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                Describe What You Want
              </label>
              <textarea
                rows={3}
                placeholder="Describe your ideal property, desired amenities, move-in timeline, or any special requests..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
              />
            </div>

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
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PreferenceModal;