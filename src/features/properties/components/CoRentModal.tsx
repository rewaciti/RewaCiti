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

  // Load saved draft from cookie once on mount only.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate from authenticated profile only when the modal opens while logged in.
  useEffect(() => {
    if (!(open && isAuthenticated)) return;

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
    // Only re-run when the modal is (re)opened, not on every customer change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-3 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto center-modal-animate">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-2xl font-semibold dark:text-white text-gray-900">
              Looking to Co-Rent?
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600 cursor-pointer">
                <FiX size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 border border-gray-600/30 p-4 rounded-xl dark:bg-[#121212] bg-white"
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
                  placeholder="e.g. Akoka, Yaba, Tanke, Lekki"
                  required
                  value={preferedLocation}
                  onChange={(e) => setPreferedLocation(e.target.value)}
                  className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                  Target Institution
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
                    buttonClassName="w-full h-[42px] px-4 flex items-center justify-between rounded-md dark:bg-black/70 bg-gray-300 border border-gray-600/70 text-gray-900 dark:text-white text-sm"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. UNILAG, LASU, OAU or Working"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
                  />
                )}
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                  Gender
                </label>
                <CustomDropdown
                  placeholder="Select Gender"
                  value={gender}
                  options={GENDER_OPTIONS}
                  onChange={(val) => setGender(val)}
                  buttonClassName="w-full h-[42px] px-4 flex items-center justify-between rounded-md dark:bg-black/70 bg-gray-300 border border-gray-600/70 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                  Preferred Partner Gender
                </label>
                <CustomDropdown
                  placeholder="Preferred Gender"
                  value={preferredPartnerGender}
                  options={PREFERRED_GENDER_OPTIONS}
                  onChange={(val) => setPreferredPartnerGender(val)}
                  buttonClassName="w-full h-[42px] px-4 flex items-center justify-between rounded-md dark:bg-black/70 bg-gray-300 border border-gray-600/70 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                  Desired Room / Shared Type
                </label>
                <CustomDropdown
                  placeholder="Select Shared Type"
                  value={roomType}
                  options={ROOM_TYPE_OPTIONS}
                  onChange={(val) => setRoomType(val)}
                  buttonClassName="w-full h-[42px] px-4 flex items-center justify-between rounded-md dark:bg-black/70 bg-gray-300 border border-gray-600/70 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                  Your Budget (Per Person)
                </label>
                <CustomDropdown
                  placeholder="Select Budget Range"
                  value={budget}
                  options={BUDGET_OPTIONS}
                  onChange={(val) => setBudget(val)}
                  buttonClassName="w-full h-[42px] px-4 flex items-center justify-between rounded-md dark:bg-black/70 bg-gray-300 border border-gray-600/70 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                  Move-in Timeline
                </label>
                <CustomDropdown
                  placeholder="When do you plan to move?"
                  value={moveInTimeline}
                  options={TIMELINE_OPTIONS}
                  onChange={(val) => setMoveInTimeline(val)}
                  buttonClassName="w-full h-[42px] px-4 flex items-center justify-between rounded-md dark:bg-black/70 bg-gray-300 border border-gray-600/70 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                About You & Co-Renting Preferences
              </label>
              <textarea
                rows={3}
                placeholder="Tell us about yourself"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
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
                {isSubmitting ? "Submitting..." : "Find Co-Rent Partners"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CoRentModal;