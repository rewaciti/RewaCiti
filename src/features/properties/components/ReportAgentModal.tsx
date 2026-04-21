import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import type { Property } from "../../../types";
import axios from "axios";
import { toast } from "sonner";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      companyId: "69b4712ce95a2df514b1c789",
      pipelineId: "69b49c7541d35d158e336621", // You might want to use a different pipeline for reports if available
      title: `AGENT REPORT: ${property.name} - ${reason}`,
      name: name,
      email: email,
      phone: phone,
      address: `${property.location.area}, ${property.location.city}, ${property.location.state}`,
      note: `Reason: ${reason}\n\nDescription: ${description}`,
      customData: [
        {
          label: "Property Name",
          value: property.name,
        },
        {
          label: "Agent ID",
          value: property.createdBy.toString(),
        },
        {
          label: "Report Reason",
          value: reason,
        }
      ]
    };

    try {
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);
      toast.success("Report submitted successfully. We will investigate this agent.");
      onOpenChange(false);
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setReason("");
      setDescription("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-6 rounded-xl shadow-2xl z-50">

          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-semibold dark:text-white text-gray-900 flex items-center gap-2">
              <FiAlertTriangle className="text-red-500" />
              Report Agent
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600">
                <FiX />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm dark:text-gray-300 text-gray-700 block mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-gray-600/10 border border-gray-600/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#703BF7] dark:text-white text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm dark:text-gray-300 text-gray-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full bg-gray-600/10 border border-gray-600/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#703BF7] dark:text-white text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm dark:text-gray-300 text-gray-700 block mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone"
                  className="w-full bg-gray-600/10 border border-gray-600/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#703BF7] dark:text-white text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="text-sm dark:text-gray-300 text-gray-700 block mb-1">Reason for Reporting</label>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-gray-600/10 border border-gray-600/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#703BF7] dark:text-white text-gray-900"
              >
                <option value="" disabled className="dark:bg-[#1A1A1A]">Select a reason</option>
                <option value="unprofessional" className="dark:bg-[#1A1A1A]">Unprofessional Behavior</option>
                <option value="misleading" className="dark:bg-[#1A1A1A]">Misleading Information</option>
                <option value="no-show" className="dark:bg-[#1A1A1A]">Agent No-show</option>
                <option value="scam" className="dark:bg-[#1A1A1A]">Suspected Scam</option>
                <option value="other" className="dark:bg-[#1A1A1A]">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm dark:text-gray-300 text-gray-700 block mb-1">Description</label>
              <textarea
                required
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

            <button
              type="submit"
              disabled={isSubmitting}
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
