import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePaystackPayment } from "react-paystack";
import { FiX, FiInfo, FiStar } from "react-icons/fi";
import type { Property } from "../../../types";

interface PropertyPaymentModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PropertyPaymentModal: React.FC<PropertyPaymentModalProps> = ({
  property,
  open,
  onOpenChange,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const price = property.price || 0;
  const ourFee = price * 0.07;
  const agentFee = price * 0.93;

  const config = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: price * 100, // Total price in kobo
    publicKey: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // Replace with real public key
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (response: { reference: string; status: string; trans: string }) => {
    alert(`Payment successful! Reference: ${response.reference}`);
    onOpenChange(false);
  };

  const onClose = () => {
    alert("Payment cancelled.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please rate our service before proceeding.");
      return;
    }
    // In a real app, you'd send the rating and feedback to your backend here
    console.log("Service Rating:", rating, "Feedback:", feedback);
    initializePayment({onSuccess, onClose});
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-6 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-semibold dark:text-white text-gray-900">
              Pay for Property
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Breakdown Section */}
            <div className="p-4 bg-gray-500/10 border border-gray-600/30 rounded-lg space-y-3">
              <h3 className="text-sm font-semibold dark:text-white text-gray-900 flex items-center gap-2">
                <FiInfo className="text-[#703BF7]" />
                Payment Breakdown
              </h3>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Property Price</span>
                <span className="font-medium dark:text-white text-gray-900">₦{price.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm border-t border-gray-600/20 pt-2">
                <span className="text-gray-600 dark:text-gray-400">Our Fee (7%)</span>
                <span className="font-medium text-[#703BF7]">₦{ourFee.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm border-t border-gray-600/20 pt-2">
                <span className="text-gray-600 dark:text-gray-400">Amount to Agent</span>
                <span className="font-medium dark:text-white text-gray-900">₦{agentFee.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-lg font-bold border-t border-[#703BF7]/50 pt-2 text-[#703BF7]">
                <span>Total Due</span>
                <span>₦{price.toLocaleString()}</span>
              </div>
            </div>

            {/* Rating Section */}
            <div className="py-2 space-y-3">
              <div>
                <label className="text-sm dark:text-gray-300 text-gray-700 block mb-2">Rate Our Service</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-colors"
                    >
                      <FiStar
                        size={24}
                        className={`${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm dark:text-gray-300 text-gray-700 block mb-1">Tell us more about your experience</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Your feedback helps us improve..."
                  className="w-full bg-gray-600/10 border border-gray-600/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#703BF7] dark:text-white text-gray-900"
                />
              </div>
              <p className="text-xs text-gray-500 italic">Your feedback helps us improve!</p>
            </div>

            <button
              type="submit"
              className="w-full bg-[#703BF7] hover:bg-[#5c2fe0] text-white font-medium py-3 rounded-md transition-colors mt-4"
            >
              Pay Total: ₦{price.toLocaleString()}
            </button>

            <p className="text-[10px] dark:text-gray-400 text-gray-500 text-center italic mt-2">
              * By proceeding, you agree to our terms of service regarding property transactions.
            </p>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PropertyPaymentModal;
