import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePaystackPayment } from "react-paystack";
import { useInspectionStore } from "../store/useInspectionStore";
import type { Property } from "../../../types";
import { FiX, FiMapPin } from "react-icons/fi";

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

  const addInspection = useInspectionStore((state) => state.addInspection);
  const updatePaymentStatus = useInspectionStore((state) => state.updatePaymentStatus);

  // Example fee calculation based on city
  const calculateFee = (city: string) => {
    const normalizedCity = city.toLowerCase();
    const fees: { [key: string]: number } = {
      yaba: 10000,
      abuja: 15000,
      "port harcourt": 12000,
      "ile-ife": 7000, 
      osogbo: 8000,
      default: 5000,
    };
    return fees[normalizedCity] || fees.default;
  };

  const amount = calculateFee(property.location.city);
  const config = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: amount * 100, // Amount in kobo
    publicKey: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // Replace with real public key
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (response: { reference: string; status: string; trans: string }) => {
    updatePaymentStatus(response.reference, "paid");
    alert(`Inspection booked successfully! Reference: ${response.reference}`);
    onOpenChange(false);
  };


  const onClose = () => {
    updatePaymentStatus(config.reference, "failed");
    alert("Payment cancelled or failed.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add pending inspection to store
    addInspection({
      propertyId: property.id,
      propertyName: property.name,
      userName: `${firstName} ${lastName}`,
      userEmail: email,
      userPhone: phone,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      amount,
      reference: config.reference,
      location: `${property.location.area}, ${property.location.city}, ${property.location.state}`,
    });

    // Start Paystack payment
    initializePayment({onSuccess, onClose});
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
                An agent will contact you with feedback within the next <span className="font-semibold text-[#703BF7]">24 hours</span> to finalize your inspection details.
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

            <button
              type="submit"
              className="w-full bg-[#703BF7] hover:bg-[#5c2fe0] text-white font-medium py-3 rounded-md transition-colors mt-4"
            >
              Pay & Book a Visit
            </button>

            <p className="text-xs dark:text-gray-400 text-gray-600 text-center italic mt-2">
            <p>
              * Payment is non-refundable and covers transportation and logistics. However, a refund will only be issued if the issue arises from our side, such as the agent failing to show up or the property being unavailable (e.g., already sold or rented but not updated on the site).
            </p>
            </p>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BookInspectionModal;
