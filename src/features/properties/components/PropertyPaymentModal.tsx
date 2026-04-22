import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiInfo, FiStar } from "react-icons/fi";
import type { Property } from "../../../types";
import axios from "axios";
import { Link } from "react-router";
import { usePropertyStore } from "../store/usePropertyStore";
import { toast } from "sonner";
import { usePaystackPayment } from "react-paystack";

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
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fees, fetchPropertyFees } = usePropertyStore();

  useEffect(() => {
    if (!fees) {
      fetchPropertyFees();
    }
  }, [fees, fetchPropertyFees]);

  const price = property.price || 0;

  // Calculate agent fee based on range
  const getAgentFeePercentage = () => {
    if (!fees) return 8; // Default fallback
    const range = fees.agent_fee_ranges.find(
      (r) => price >= r.min && (r.max === null || price <= r.max)
    );
    return range ? range.percentage : 8;
  };

  const agentPercentage = getAgentFeePercentage();
  const houseFeePercentage = 100 - agentPercentage;

  const agentFee = price * (agentPercentage / 100);
  const houseFee = price * (houseFeePercentage / 100);

  const fullName = `${firstName} ${lastName}`.trim();
  const propertyUrl = window.location.href;

  const config = {
    reference: `prop_${new Date().getTime().toString()}`,
    email: email,
    amount: price * 100, // Paystack amount is in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    firstname: firstName,
    lastname: lastName,
    phone: phone,
  };

  const initializePayment = usePaystackPayment(config);

  const handleSuccess = async (reference: { reference: string }) => {
    setIsSubmitting(true);
    const payload = {
      companyId: "69b4712ce95a2df514b1c789",
      pipelineId: "69b49c7541d35d158e336621",
      title: `PROPERTY PAYMENT: ${property.name} - ${fullName}`,
      name: fullName,
      amount: `(₦${price.toLocaleString()})`,
      email: email,
      phone: phone,
      address: `${property.location.area}, ${property.location.city}, ${property.location.state}`,
      note: `Rating: ${rating}/5\nFeedback: ${feedback}\nPayment Reference: ${reference.reference}`,
      customData: [
        { label: "Property Name", value: property.name },
        { label: "Property Link", value: propertyUrl },
        { label: "Total Property Price", value: `₦${price.toLocaleString()}` },
        { label: "Payment Reference", value: reference.reference },
        { label: "Service Rating", value: `${rating} Stars` },
        { label: "Agent Fee", value: `₦${agentFee.toLocaleString()} (${agentPercentage}%)` },
        { label: "House Fee", value: `₦${houseFee.toLocaleString()} (${houseFeePercentage}%)` },
        { label: "Agent ID", value: property.createdBy.toString() }
      ]
    };

    try {
      // Send to SabiFlow
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);
      
      toast.success(`Payment successful!\nReference: ${reference.reference}\nInformation sent to our team.`, {
        duration: 5000,
      });
      onOpenChange(false);

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setRating(0);
      setFeedback("");
    } catch (error) {
      console.error("Error submitting payment details:", error);
      toast.error("Payment successful, but failed to send data to CRM. Please contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onClose = () => {
    toast.info("Payment cancelled.");
    setIsSubmitting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please rate our service before proceeding.");
      return;
    }

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }
    
    setIsSubmitting(true);
    initializePayment({ onSuccess: handleSuccess, onClose });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-6 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto" aria-describedby="property-payment-description">
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

          <p id="property-payment-description" className="sr-only">Complete your property payment securely using Paystack. All details are required for processing.</p>
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
           <div className="p-3 bg-gray-500/10 border border-gray-600/30 rounded-lg">
              <p className="text-sm dark:text-gray-300 text-gray-700 text-center">
                A verified agent will reach out within the next{" "}
                <span className="font-semibold text-[#703BF7]">24 hours</span> to complete your property details and next steps.
              </p>

              <p className="text-sm dark:text-gray-300 text-gray-700 text-center mt-1">
                The Agent's Contact details will be shared once your payment has been successfully confirmed.
              </p>
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
                <span className="text-gray-600 dark:text-gray-400">Agent Fee ({agentPercentage}%)</span>
                <span className="font-medium dark:text-white text-gray-900">₦{agentFee.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm border-t border-gray-600/20 pt-2">
                <span className="text-gray-600 dark:text-gray-400">House Fee ({houseFeePercentage}%)</span>
                <span className="font-medium dark:text-white text-gray-900">₦{houseFee.toLocaleString()}</span>
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
                ></textarea>
              </div>
              <p className="text-xs text-gray-500 italic">Your feedback helps us improve!</p>
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
              {isSubmitting ? "Processing..." : `Pay Total: ₦${price.toLocaleString()}`}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PropertyPaymentModal;
