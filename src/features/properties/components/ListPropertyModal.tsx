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

interface ListPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LISTER_ROLE_OPTIONS = [
  { label: "Real Estate Agent / Broker", value: "Real Estate Agent" },
  { label: "Property Owner / Landlord", value: "Property Owner / Landlord" },
  { label: "Caretaker / Facility Manager", value: "Caretaker" },
  { label: "Property Developer / Builder", value: "Developer" },
  { label: "Other", value: "Other" },
];

const ListPropertyModal: React.FC<ListPropertyModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { isAuthenticated, customer } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [listerRole, setListerRole] = useState("Real Estate Agent");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const cookieKey = "rewaciti_become_lister_inquiry";

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
        setLocation(parsed.location || "");
        setMessage(parsed.message || "");
        setAgreed(parsed.agreed || false);
      } catch {
        // ignore malformed cookie data
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
        console.error("Failed to fetch profile for become a lister form:", error);
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
      listerRole,
      location,
      message,
      agreed,
    };

    setCookie(cookieKey, JSON.stringify(payload));
  }, [name, email, phone, listerRole, location, message, agreed]);

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

    const payload = {
      companyId: COMPANY_ID,
      pipelineId: "69cec9f3dd40685bfe20adb2",
      title: `Become a Lister Request from ${name.trim()} (${listerRole}) - ${location.trim()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: location.trim(),
      note: message || `Application to become a lister (${listerRole}) in ${location.trim()}.`,
      customData: [
        { label: "Inquiry Type", value: "Become a Lister" },
        { label: "Lister Role", value: listerRole },
        { label: "Primary Area / Location", value: location.trim() },
        { label: "About Properties / Experience", value: message || "None" },
      ],
    };

    try {
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);
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
          location: "",
          message: "",
          agreed: false,
        })
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting lister request:", error);
      toast.error("Failed to submit request. Please try again.");
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
    Boolean(location.trim());

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs dialog-overlay-animate" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-3 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto center-modal-animate">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-2xl font-semibold dark:text-white text-gray-900">
              Become a Lister
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
                  I am a...
                </label>
                <CustomDropdown
                  placeholder="Select Lister Role"
                  value={listerRole}
                  options={LISTER_ROLE_OPTIONS}
                  onChange={(val) => setListerRole(val)}
                  buttonClassName="w-full h-[42px] px-4 flex items-center justify-between rounded-md dark:bg-black/70 bg-gray-300 border border-gray-600/70 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                  Primary Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mayfair, Ede Road, Ile-Ife"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none dark:placeholder-gray-400 placeholder-gray-900/70 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                About You
              </label>
              <textarea
                rows={3}
                placeholder="Tell us a bit about yourself and your experience as a lister."
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
                {isSubmitting ? "Submitting..." : "Become a Lister"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ListPropertyModal;