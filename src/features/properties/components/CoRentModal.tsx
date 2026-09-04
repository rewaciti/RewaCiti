import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiUsers, FiUserCheck } from "react-icons/fi";
import { Link } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import { COMPANY_ID, useAuthStore } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { getCookie, setCookie } from "../../../shared/lib/utils";
import CustomDropdown from "./CustomDropdown";

interface CoRentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universityOptions?: { label: string; value: string }[];
}

const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

const PREFERRED_GENDER_OPTIONS = [
  { label: "Any / No Preference", value: "Any" },
  { label: "Male Only", value: "Male" },
  { label: "Female Only", value: "Female" },
];

const ROOM_TYPE_OPTIONS = [
  { label: "Shared Room (2 in a room)", value: "Shared Room (2 in a room)" },
  { label: "Single Room in Shared Apartment", value: "Single Room (Private Room)" },
  { label: "Self Contain Share", value: "Self Contain Share" },
  { label: "2-Bedroom Flat Share", value: "2-Bedroom Flat Share" },
  { label: "3-Bedroom Flat Share", value: "3-Bedroom Flat Share" },
];

const BUDGET_OPTIONS = [
  { label: "Below ₦150k / year", value: "Below ₦150k" },
  { label: "₦150k - ₦250k / year", value: "₦150k - ₦250k" },
  { label: "₦250k - ₦400k / year", value: "₦250k - ₦400k" },
  { label: "₦400k - ₦600k / year", value: "₦400k - ₦600k" },
  { label: "₦600k - ₦1M / year", value: "₦600k - ₦1M" },
  { label: "Above ₦1M / year", value: "Above ₦1M" },
];

const TIMELINE_OPTIONS = [
  { label: "Immediately", value: "Immediately" },
  { label: "Within 2 weeks", value: "Within 2 weeks" },
  { label: "Next Month", value: "Next Month" },
  { label: "Next Semester / Session", value: "Next Semester / Session" },
];

const CoRentModal: React.FC<CoRentModalProps> = ({
  open,
  onOpenChange,
  universityOptions = [],
}) => {
  const { isAuthenticated, customer } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [preferedLocation, setPreferedLocation] = useState("");
  const [gender, setGender] = useState("");
  const [preferredPartnerGender, setPreferredPartnerGender] = useState("Any");
  const [roomType, setRoomType] = useState("");
  const [budget, setBudget] = useState("");
  const [moveInTimeline, setMoveInTimeline] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const coRentCookieKey = "rewaciti_corent_request";
  const cookieLoaded = useRef(false);

  useEffect(() => {
    const savedData = getCookie(coRentCookieKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
        setInstitution(parsed.institution || "");
        setPreferedLocation(parsed.preferedLocation || "");
        setGender(parsed.gender || "");
        setPreferredPartnerGender(parsed.preferredPartnerGender || "Any");
        setRoomType(parsed.roomType || "");
        setBudget(parsed.budget || "");
        setMoveInTimeline(parsed.moveInTimeline || "");
        setMessage(parsed.message || "");
        setAgreed(parsed.agreed || false);
      } catch {
        // ignore malformed cookie
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
          console.error("Failed to fetch profile for co-rent form:", error);
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
      institution,
      preferedLocation,
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
    institution,
    preferedLocation,
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

    const payload = {
      companyId: COMPANY_ID,
      pipelineId: "6a9a70d121202229fbb92a98",
      title: `Co-Rent Request: ${name.trim()} (${gender || "Unspecified"} looking for ${preferredPartnerGender}) - ${preferedLocation.trim()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: preferedLocation.trim(),
      note: message || "Looking to co-rent a property",
      customData: [
        { label: "Request Type", value: "Co-Rent Match" },
        { label: "Institution / Campus", value: institution || "N/A" },
        { label: "Preferred Location", value: preferedLocation.trim() },
        { label: "Applicant Gender", value: gender || "Not specified" },
        { label: "Preferred Co-Rent Partner Gender", value: preferredPartnerGender },
        { label: "Room / Share Type", value: roomType || "Any" },
        { label: "Budget per Person", value: budget || "Flexible" },
        { label: "Move-in Timeline", value: moveInTimeline || "Flexible" },
        { label: "Lifestyle / About Applicant", value: message || "No extra notes" },
      ],
    };

    try {
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);
      toast.success(
        <div className="whitespace-pre-wrap">
          Co-rent request submitted successfully!
          <br />Our team will connect you with matching co-tenants soon.
        </div>
      );
      setName("");
      setEmail("");
      setPhone("");
      setInstitution("");
      setPreferedLocation("");
      setGender("");
      setPreferredPartnerGender("Any");
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
          institution: "",
          preferedLocation: "",
          gender: "",
          preferredPartnerGender: "Any",
          roomType: "",
          budget: "",
          moveInTimeline: "",
          message: "",
          agreed: false,
        })
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting co-rent request:", error);
      toast.error("Failed to submit co-rent request. Please try again.");
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
                  <FiUsers size={22} />
                </div>
                <Dialog.Title className="text-xl md:text-2xl font-bold dark:text-white text-gray-900">
                  Looking to Co-Rent?
                </Dialog.Title>
              </div>
              <Dialog.Description className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Connect with compatible students or co-tenants to split rent, share verified properties, and save costs.
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
                  Full Name <span className="text-red-500">*</span>
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
                  Email Address <span className="text-red-500">*</span>
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
                  Phone / WhatsApp <span className="text-red-500">*</span>
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
                  Preferred Location / Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Akoka, Yaba, Tanke, Lekki"
                  required
                  value={preferedLocation}
                  onChange={(e) => setPreferedLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-[#703BF7] text-sm dark:placeholder-gray-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Target School / Institution
                </label>
                {universityOptions.length > 0 ? (
                  <CustomDropdown
                    placeholder="Select Institution"
                    value={institution}
                    options={[
                      { label: "Not a student / Other", value: "Other" },
                      ...universityOptions,
                    ]}
                    onChange={(val) => setInstitution(val)}
                    buttonClassName="w-full h-10.5 px-3.5 flex items-center justify-between rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm focus:border-[#703BF7]"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. UNILAG, LASU, OAU or Working"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-[#703BF7] text-sm dark:placeholder-gray-500 placeholder-gray-400"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Your Gender
                </label>
                <CustomDropdown
                  placeholder="Select Gender"
                  value={gender}
                  options={GENDER_OPTIONS}
                  onChange={(val) => setGender(val)}
                  buttonClassName="w-full h-10.5 px-3.5 flex items-center justify-between rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm focus:border-[#703BF7]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Preferred Partner Gender
                </label>
                <CustomDropdown
                  placeholder="Preferred Gender"
                  value={preferredPartnerGender}
                  options={PREFERRED_GENDER_OPTIONS}
                  onChange={(val) => setPreferredPartnerGender(val)}
                  buttonClassName="w-full h-10.5 px-3.5 flex items-center justify-between rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm focus:border-[#703BF7]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Desired Room / Shared Type
                </label>
                <CustomDropdown
                  placeholder="Select Shared Type"
                  value={roomType}
                  options={ROOM_TYPE_OPTIONS}
                  onChange={(val) => setRoomType(val)}
                  buttonClassName="w-full h-10.5 px-3.5 flex items-center justify-between rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm focus:border-[#703BF7]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Your Budget (Per Person)
                </label>
                <CustomDropdown
                  placeholder="Select Budget Range"
                  value={budget}
                  options={BUDGET_OPTIONS}
                  onChange={(val) => setBudget(val)}
                  buttonClassName="w-full h-10.5 px-3.5 flex items-center justify-between rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm focus:border-[#703BF7]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Move-in Timeline
                </label>
                <CustomDropdown
                  placeholder="When do you plan to move?"
                  value={moveInTimeline}
                  options={TIMELINE_OPTIONS}
                  onChange={(val) => setMoveInTimeline(val)}
                  buttonClassName="w-full h-10.5 px-3.5 flex items-center justify-between rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm focus:border-[#703BF7]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 block">
                About You & Co-Renting Preferences
              </label>
              <textarea
                placeholder="Tell us about yourself (e.g., student level, occupation, sleep schedule, study habits, quiet/social, cleanliness preferences)..."
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-100 dark:bg-black/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-[#703BF7] text-sm resize-none dark:placeholder-gray-500 placeholder-gray-400"
              />
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="modal-agree-corent-terms"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-400 accent-[#703BF7] cursor-pointer"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <label htmlFor="modal-agree-corent-terms" className="text-xs md:text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-snug">
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
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition shadow-md ${isFormValid
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
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <FiUserCheck size={16} />
                    <span>Find Co-Rent Partners</span>
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

export default CoRentModal;
