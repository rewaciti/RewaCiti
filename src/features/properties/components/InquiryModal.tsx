import React, { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX } from "react-icons/fi";
import { Link } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import { COMPANY_ID, useAuthStore } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { formatCurrency, getCookie, setCookie } from "../../../shared/lib/utils";
import type { Property } from "../../../types";

interface InquiryModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InquiryModal: React.FC<InquiryModalProps> = ({ property, open, onOpenChange }) => {
  const { isAuthenticated, customer } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const inquiryCookieKey = "rewaciti_property_details_inquiry";
  const cookieLoaded = useRef(false);

  useEffect(() => {
    const savedInquiry = getCookie(inquiryCookieKey);
    if (savedInquiry) {
      try {
        const parsed = JSON.parse(savedInquiry);
        setFullName(parsed.fullName || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
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
          setFullName(nameFromCustomer);
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
          console.error("Failed to fetch profile for property details form:", error);
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
      fullName,
      email,
      phone,
      message,
      agreed,
    };

    setCookie(inquiryCookieKey, JSON.stringify(payload));
  }, [fullName, email, phone, message, agreed]);

  const price = property.pricing.TotalCost ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please enter your full name, email, and phone number to send a message.");
      return;
    }

    setIsSubmitting(true);

    const trimmedName = fullName.trim();
    const propertyUrl = window.location.href;
    const ownerId = property.createdBy?._id ?? property.createdBy?.id;

    const payload = {
      companyId: COMPANY_ID,
      pipelineId: "69b49c7541d35d158e336621",
      title: `${trimmedName} interested in ${property.name} (₦${formatCurrency(price)})`,
      name: trimmedName,
      amount: price,
      email,
      phone,
      address: `${property.location.area}, ${property.location.city_town}, ${property.location.state} state.`,
      note: message,
      ...(ownerId ? { ownerId } : {}),
      customData: [
        {
          label: "Property",
          value: property.name,
        },
        {
          label: "Property Link",
          value: propertyUrl,
        },
        {
          label: "Category",
          value: property.category,
        },
        {
          label: "Location",
          value: `${property.location.area}, ${property.location.city_town}, ${property.location.state} state.`,
        },
        ...(ownerId ? [{ label: "Agent ID", value: ownerId }] : []),
        { label: "Property ID", value: property.id },
        ...(property.caretakerContact?.whatsapp ? [{ label: "Caretaker WhatsApp", value: property.caretakerContact.whatsapp }] : []),
        ...(property.caretakerContact?.phone ? [{ label: "Caretaker Phone", value: property.caretakerContact.phone }] : []),
      ],
    };

    try {
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);
      toast.success(
        <div className="whitespace-pre-wrap">
          Message sent successfully!
          <br />
          A member of our team will get back to you soon.
        </div>
      );
      // reset form
      setFullName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setAgreed(false);
      setCookie(inquiryCookieKey, JSON.stringify({
        fullName: "",
        email: "",
        phone: "",
        message: "",
        agreed: false,
      }));
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs dialog-overlay-animate" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-3 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto center-modal-animate">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-2xl font-semibold dark:text-white text-gray-900">
              Inquire About This Property
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
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                Selected Property
              </label>
              <input
                type="text"
                value={`${property?.name}, ${property?.location?.area}, ${property?.location?.city_town}, ${property?.location?.state} state.`}
                readOnly
                className="w-full dark:bg-black/70 bg-gray-300 border border-gray-600/70 rounded-md px-4 py-2 text-sm focus:outline-none text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            <div>
              <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block">
                Message
              </label>
              <textarea
                rows={3}
                placeholder="Enter your Message here..."
                required
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
                I agree with the <Link to="/terms" target="_blank" rel="noreferrer" className="text-[#703BF7] underline">Terms</Link> and <Link to="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#703BF7] underline">Privacy Policy</Link>.
              </p>
            </div>

            <div className="sm:col-span-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={!agreed || isSubmitting || !fullName.trim() || !email.trim() || !phone.trim()}
                className={`px-4 py-3 rounded-lg font-medium transition
                  ${agreed && !isSubmitting && fullName.trim() && email.trim() && phone.trim()
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

export default InquiryModal;