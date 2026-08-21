import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import type { Property } from "../../../types";
import axios from "axios";
import { toast } from "sonner";
import { COMPANY_ID, useAuthStore } from "../../auth/store/useAuthStore";
import CustomDropdown from "./CustomDropdown";
import { authAPI } from "../../auth/services/authAPI";
import { getCookie, setCookie } from "../../../shared/lib/utils";
import { Link } from "react-router";

interface ReportAgentModalProps {


  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportAgentModal: React.FC<ReportAgentModalProps> = ({
  property,
  open,
  onOpenChange,
}) => {
  const { isAuthenticated, customer } = useAuthStore();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePhone, setProfilePhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const modalCookieKey = "rewaciti_report_modal";

  const name = customer ? `${customer.firstName} ${customer.lastName}`.trim() : guestName;
  const email = customer?.email ?? guestEmail;
  const phone = profilePhone || customer?.phoneNumber || guestPhone;

  React.useEffect(() => {
    const savedForm = getCookie(modalCookieKey);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        setGuestName(parsed.guestName || "");
        setGuestEmail(parsed.guestEmail || "");
        setGuestPhone(parsed.guestPhone || "");
        setReason(parsed.reason || "");
        setDescription(parsed.description || "");
        setAgreed(parsed.agreed || false);
      } catch {
        // ignore malformed cookie data
      }
    }

    if (open && isAuthenticated) {
      const fetchProfile = async () => {
        try {
          const profileData = await authAPI.getProfile();
          const latestPhone = profileData.phoneNumber || "";
          setProfilePhone(latestPhone);

          const currentCustomer = useAuthStore.getState().customer;
          if (currentCustomer && currentCustomer.phoneNumber !== latestPhone) {
            useAuthStore.getState().setCustomer({
              ...currentCustomer,
              phoneNumber: latestPhone,
            });
          }
        } catch (error) {
          console.error("Failed to fetch profile in report modal:", error);
        }
      };
      fetchProfile();
    }
  }, [open, isAuthenticated]);

  React.useEffect(() => {
    setCookie(modalCookieKey, JSON.stringify({ guestName, guestEmail, guestPhone, reason, description, agreed }));
  }, [guestName, guestEmail, guestPhone, reason, description, agreed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please enter your full name, email, and phone number before submitting your report.");
      return;
    }

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy before submitting your report.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyId: COMPANY_ID,
      pipelineId: "6a2a0b1ff19944ca7f9aa4b9",
      title: `AGENT REPORT: ${property.name} - ${reason}`,
      name: name,
      email: email,
      phone: phone,
      address: `${property.location.area}, ${property.location.city_town}, ${property.location.state} state.`,
      note: `Description: ${description || "No additional details provided"}`,
      customData: [
        {
          label: "Property Name",
          value: property.name,
        },
        ...(property.createdBy?._id || property.createdBy?.id
          ? [
            {
              label: "Agent ID",
              value: property.createdBy._id ?? property.createdBy.id,
            },
          ]
          : []),
        {
          label: "Property ID",
          value: property.id,
        },
        {
          label: "Report Reason",
          value: reason,
        },
        ...(property.caretakerContact?.whatsapp ? [{ label: "Caretaker WhatsApp", value: property.caretakerContact.whatsapp }] : []),
        ...(property.caretakerContact?.phone ? [{ label: "Caretaker Phone", value: property.caretakerContact.phone }] : [])
      ]
    };

    const apiBaseUrl = import.meta.env.VITE_API_URL || "https://api.sabiflow.com/api";
    const candidateUrls = [
      `${apiBaseUrl}/crm/deals/guest`,
      `${apiBaseUrl}/crm/deals`,
      "https://api.sabiflow.com/api/crm/deals/guest",
    ];

    try {
      let lastError: unknown;

      for (const url of candidateUrls) {
        try {
          await axios.post(url, payload);
          toast.success("Report submitted successfully.\nThank you for your feedback. We will investigate the issue appropriately.");
          onOpenChange(false);
          setReason("");
          setDescription("");
          setCookie(modalCookieKey, JSON.stringify({ guestName: "", guestEmail: "", guestPhone: "", reason: "", description: "", agreed: false }));
          return;
        } catch (error) {
          lastError = error;
          const isMissingEndpoint = axios.isAxiosError(error) && error.response?.status === 404;
          if (!isMissingEndpoint) {
            throw error;
          }
        }
      }

      throw lastError;
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("The report service is currently unavailable. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm center-modal-animate" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-4 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto center-modal-animate">

          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-semibold dark:text-white text-gray-900 flex items-center gap-2">
              <FiAlertTriangle className="text-red-500" />
              Report Agent
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Report an agent for unprofessional behavior or suspected scams related to {property.name}.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600">
                <FiX />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isAuthenticated && customer ? (
              <div className="p-4 bg-gray-500/10 border border-gray-600/30 rounded-lg space-y-2">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Your Details</h4>
                <div className="text-sm dark:text-gray-300 text-gray-700 space-y-1">
                  <p><span className="font-semibold">Name:</span> {name}</p>
                  <p><span className="font-semibold">Email:</span> {email}</p>
                  <p><span className="font-semibold">Phone:</span> {phone || <span className="italic text-red-500">No phone number listed in profile</span>}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border border-gray-600/30 bg-gray-500/10 p-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-md border border-gray-600/30 bg-white/80 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#703BF7] dark:bg-[#1A1A1A] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-600/30 bg-white/80 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#703BF7] dark:bg-[#1A1A1A] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full rounded-md border border-gray-600/30 bg-white/80 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#703BF7] dark:bg-[#1A1A1A] dark:text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm dark:text-gray-300 text-gray-700 block mb-1">Reason for Reporting</label>
              <CustomDropdown
                placeholder="Select a reason"
                value={reason}
                options={[
                  { label: "Unprofessional Behavior", value: "unprofessional" },
                  { label: "Misleading Information", value: "misleading" },
                  { label: "Agent No-show", value: "no-show" },
                  { label: "Suspected Scam", value: "scam" },
                  { label: "Other", value: "other" },
                ]}
                onChange={(val) => setReason(val)}
              />
            </div>

            <div>
              <label className="text-sm dark:text-gray-300 text-gray-700 block mb-1">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide more details..."
                className="w-full bg-gray-600/10 border border-gray-600/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#703BF7] dark:text-white text-gray-900"
              />
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-500">
              Reporting an agent is a serious matter. We will review your report and take appropriate action.
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <p className="text-sm text-gray-700 dark:text-gray-300 ">
                I agree with the <Link to="/terms" target="_blank" rel="noreferrer" className="text-[#703BF7] underline">Terms</Link> and <Link to="/privacy-policy" target="_blank" rel="noreferrer" className="text-[#703BF7] underline">Privacy Policy</Link>.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !email.trim() || !phone.trim() || !agreed}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-md transition-colors mt-4 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ReportAgentModal;
