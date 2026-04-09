import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useInspectionStore } from "../store/useInspectionStore";
import type { Property } from "../../../types";
import { FiX, FiMapPin } from "react-icons/fi";
import axios from "axios";
import { Link } from "react-router";

interface BookInspectionModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BookInspectionModal: React.FC<BookInspectionModalProps> = ({
  property,
  open,
  onOpenChange,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addInspection = useInspectionStore((state) => state.addInspection);
  const updatePaymentStatus = useInspectionStore((state) => state.updatePaymentStatus);

  // Example fee calculation based on city
  const calculateFee = (city: string) => {
    const normalizedCity = city.toLowerCase();
    const fees: { [key: string]: number } = {
      yaba: 10000,
      abuja: 15000,
      "port harcourt": 12000,
      "ile-ife": 3000, 
      osogbo: 8000,
      default: 5000,
    };
    return fees[normalizedCity] || fees.default;
  };

  const amount = calculateFee(property.location.city);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      alert("Please agree to the Terms and Privacy Policy");
      return;
    }

    setIsSubmitting(true);

    const fullName = `${firstName} ${lastName}`.trim();
    const reference = `demo_visit_${new Date().getTime()}`;
    const propertyAddress = `${property.location.area}, ${property.location.city}, ${property.location.state}`;
    const propertyUrl = window.location.href;

    const payload = {
      companyId: "69b4712ce95a2df514b1c789",
      pipelineId: "69b49c7541d35d158e336621",
      title: `VISIT BOOKING: ${property.name} - ${fullName}`,
      name: fullName,
      amount: `(₦${amount.toLocaleString()})`,
      email: email,
      phone: phone,
      address: propertyAddress,
      note: `Reference: ${reference}\nTask: Property Visit/Inspection\nProperty Link: ${propertyUrl}`,
      customData: [
        { label: "Property Name", value: property.name },
        { label: "Property Link", value: propertyUrl },
        { label: "Booking Reference", value: reference },
        { label: "Inspection Fee", value: `₦${amount.toLocaleString()}` },
        { label: "Agent ID", value: property.createdBy.toString() },
        { label: "Property Type", value: property.type }
      ]
    };

    try {
      // Simulate Processing Delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Send to SabiFlow CRM
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);

      // Add to local store for UI tracking
      addInspection({
        propertyId: property.id,
        propertyName: property.name,
        userName: fullName,
        userEmail: email,
        userPhone: phone,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        amount,
        reference: reference,
        location: propertyAddress,
      });

      updatePaymentStatus(reference, "paid");
      
      alert(`Visit booked successfully! (Demo Mode)\nReference: ${reference}\nOur team will contact you within 24 hours.`);
      onOpenChange(false);
      
      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      console.error("Error submitting visit booking:", error);
      alert("Failed to submit booking details to CRM. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-6 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-semibold dark:text-white text-gray-900">
              Book a Visit
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600">
                <FiX />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm dark:text-gray-300 text-gray-700 block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-gray-600/10 border border-gray-600/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#703BF7] dark:text-white text-gray-900"
                />
              </div>
              <div>
                <label className="text-sm dark:text-gray-300 text-gray-700 block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-gray-600/10 border border-gray-600/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#703BF7] dark:text-white text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="text-sm dark:text-gray-300 text-gray-700 block mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className="w-full bg-gray-600/10 border border-gray-600/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#703BF7] dark:text-white text-gray-900"
              />
            </div>
            <div className="p-3 bg-gray-500/10 border border-gray-600/30 rounded-lg">
              <p className="text-sm dark:text-gray-300 text-gray-700 text-center">
                A verified agent will contact you within the next{" "}
                <span className="font-semibold text-[#703BF7]">24 hours</span> to finalize your inspection arrangements.
              </p>

              <p className="text-sm dark:text-gray-300 text-gray-700 text-center mt-1">
                The agent’s contact details will be shared once your booking has been successfully confirmed.
              </p>
            </div>

            <div className="p-3 bg-[#703BF7]/10 rounded-lg border border-[#703BF7]/30 space-y-2">
              <div className="border-b border-[#703BF7]/20 pb-2 mb-2">
                <h4 className="font-semibold dark:text-white text-gray-900">{property.name}</h4>
                <p className="text-xs dark:text-gray-400 text-gray-600">{property.type} • {property.bedrooms} Bedrooms</p>
              </div>
              <div className="flex items-start gap-2 text-sm dark:text-gray-300 text-gray-700">
                <FiMapPin className="text-[#703BF7] mt-1 shrink-0" />
                <span>{property.location.area}, {property.location.city}, {property.location.state}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#703BF7]/20 pt-2">
                <span className="text-sm font-medium dark:text-white text-gray-900">Inspection Fee</span>
                <span className="text-lg font-bold text-[#703BF7]">₦{amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <p className="dark:text-white text-gray-900 text-sm">
                I agree with the{" "}
                <Link to="/terms" className="hover:text-[#703BF7] text-[#703BF7] underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link to="/privacy-policy" className="hover:text-[#703BF7] text-[#703BF7] underline">
                  Privacy Policy
                </Link>
              </p>
            </div>

            <button
              type="submit"
              disabled={!agreed || isSubmitting}
              className={`w-full font-medium py-3 rounded-md transition-colors mt-4 disabled:opacity-50 ${
                agreed && !isSubmitting
                  ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white"
                  : "bg-gray-400 cursor-not-allowed text-gray-200"
              }`}
            >
              {isSubmitting ? "Processing..." : "Pay & Book a Visit"}
            </button>

            {/* <p className="text-xs dark:text-gray-400 text-gray-600 text-center italic mt-2">
              * Payment is non-refundable. However, a refund will only be issued if the issue arises from our side, such as the agent failing to show up or the property being unavailable (e.g., already sold or rented but not updated on the site).
            </p> */}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BookInspectionModal;
