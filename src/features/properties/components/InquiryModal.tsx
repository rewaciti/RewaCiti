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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
        setFirstName(parsed.firstName || "");
        setLastName(parsed.lastName || "");
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
          setFirstName(customer?.firstName || "");
          setLastName(customer?.lastName || "");
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
      firstName,
      lastName,
      email,
      phone,
      message,
      agreed,
    };

    setCookie(inquiryCookieKey, JSON.stringify(payload));
  }, [firstName, lastName, email, phone, message, agreed]);

  const price = property.pricing.TotalCost ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please enter your full name, email, and phone number to send a message.");
      return;
    }

    setIsSubmitting(true);

    const fullName = `${firstName} ${lastName}`.trim();
    const propertyUrl = window.location.href;
    const ownerId = property.createdBy?._id ?? property.createdBy?.id;

    const payload = {
      companyId: COMPANY_ID,
      pipelineId: "69b49c7541d35d158e336621",
      title: `${fullName} interested in ${property.name} (₦${formatCurrency(price)})`,
      name: fullName,
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
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setAgreed(false);
      setCookie(inquiryCookieKey, JSON.stringify({
        firstName: "",
        lastName: "",
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
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-6 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto center-modal-animate">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-2xl font-semibold dark:text-white text-gray-900">
              Inquire About This Property
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600 cursor-pointer">
                <FiX size={20} />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-gray-800 dark:text-gray-400 text-sm mb-6">
            Interested in this property? Fill out the form below, and our real estate experts will get back to you with more details.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300 font-medium">First Name</label>
                <input
                  type="text"
                  placeholder="Enter First Name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-gray-600/10 dark:bg-gray-600/30 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
                />
              </div>

              <div>
                <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300 font-medium">Last Name</label>
                <input
                  type="text"
                  placeholder="Enter Last Name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-gray-600/10 dark:bg-gray-600/30 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300 font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Enter your Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-600/10 dark:bg-gray-600/30 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
                />
              </div>

              <div>
                <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300 font-medium">Phone</label>
                <input
                  type="tel"
                  placeholder="Enter Phone Number"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-600/10 dark:bg-gray-600/30 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
                />
              </div>
            </div>

            <div>
              <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300 font-medium">Selected Property</label>
              <input
                type="text"
                value={`${property?.name}, ${property?.location?.area}, ${property?.location?.city_town}, ${property?.location?.state} state.`}
                readOnly
                className="w-full bg-gray-600/10 dark:bg-gray-600/30 border border-gray-600/30 rounded-md px-4 py-2 text-sm focus:outline-none text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            <div>
              <label className="text-sm mb-1 block text-gray-700 dark:text-gray-300 font-medium">Message</label>
              <textarea
                rows={4}
                placeholder="Enter your Message here..."
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-gray-600/10 dark:bg-gray-600/30 border border-gray-600/30 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#703BF7] text-gray-900 dark:text-white dark:placeholder-gray-400 placeholder-gray-900/70"
              />
            </div>

            <div className="flex items-center gap-3 font-medium">
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

            <button
              type="submit"
              disabled={!agreed || isSubmitting || !firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()}
              className={`w-full font-medium py-3 rounded-md transition-colors mt-4 disabled:opacity-50 ${
                agreed && !isSubmitting && firstName.trim() && lastName.trim() && email.trim() && phone.trim()
                  ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed text-gray-200"
              }`}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default InquiryModal;
