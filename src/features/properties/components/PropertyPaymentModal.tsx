import React, { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiInfo, FiStar, FiDownload, FiCheckCircle } from "react-icons/fi";
import type { Property } from "../../../types";
import axios from "axios";
import { Link } from "react-router";
import { toast } from "sonner";
import { usePaystackPayment } from "react-paystack";
import * as sabiflow from "../../../shared/lib/sabiflow";

interface PropertyPaymentModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number;
  reference: string;
  access_code?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
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
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "paid" | "failed">("idle");
  const [saleId, setSaleId] = useState<string | null>(null);
  const [paystackConfig, setPaystackConfig] = useState<PaystackConfig | null>(null);

  const price = property.pricing.TotalCost || 0;
  const pricing = property.pricing;

  const fullName = `${firstName} ${lastName}`.trim();

  const handlePaymentSuccess = useCallback(async () => {
    if (!saleId) return;
    
    setIsSubmitting(true);
    try {
      await sabiflow.verifyPayment(saleId);
      setPaymentStatus("paid");
      toast.success("Payment verified successfully!");
      
      // Also send to CRM deal for tracking as before
      const payload = {
        companyId: "69b4712ce95a2df514b1c789",
        pipelineId: "69ed7a4ac09e9388ba096f1f",
        title: `PROPERTY PURCHASE: ${property.name} - ${fullName}`,
        name: fullName,
        amount: price,
        email: email,
        phone: phone,
        address: `${property.location.area}, ${property.location.city}, ${property.location.state}`,
        note: `Rating: ${rating}/5\nFeedback: ${feedback}\nSale ID: ${saleId}`,
        customData: [
          { label: "Property Name", value: property.name },
          { label: "Total Property Price", value: price },
          { label: "Sale ID", value: saleId },
          { label: "Service Rating", value: `${rating} Stars` },
          { label: "Property Cost", value: `₦${pricing.PropertyCost.toLocaleString()}` },
          { label: "Legal Fee", value: `₦${pricing.LegalFee.toLocaleString()}` },
          { label: "Agent Fee", value: `₦${pricing.AgentFee.toLocaleString()}` },
          { label: "Service Fee", value: `₦${pricing.ServiceFee.toLocaleString()}` },
          { label: "Caution Fee", value: `₦${pricing.CautionFee.toLocaleString()}` },
          { label: "Agent ID", value: property.createdBy.toString() },
          { label: "Property ID", value: property.id }
        ]
      };
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);

    } catch (error: unknown) {
      console.error("Error verifying payment:", error);
      toast.error("Failed to verify payment. Please contact support.");
      setPaymentStatus("failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [saleId, fullName, price, email, phone, property, pricing, rating, feedback]);

  const handlePaystackClose = useCallback(() => {
    toast.info("Payment window closed.");
    setIsSubmitting(false);
    setPaymentStatus("idle");
  }, []);

  const initializePaystack = usePaystackPayment(paystackConfig || { publicKey: "", email: "", amount: 0, reference: "" });

  // Trigger Paystack when config is updated with accessCode
  useEffect(() => {
    if (paystackConfig?.access_code && paymentStatus === "pending") {
      initializePaystack({
        onSuccess: handlePaymentSuccess,
        onClose: handlePaystackClose
      });
    }
  }, [paystackConfig, paymentStatus, initializePaystack, handlePaymentSuccess, handlePaystackClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please rate our service before proceeding.");
      return;
    }

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    if (price > 5000000) {
      toast.warning("For payments above ₦5,000,000, please contact our support team directly.");
      return;
    }
    
    setIsSubmitting(true);
    setPaymentStatus("pending");

    try {
      // 1. Create Sale
      const saleResponse = await sabiflow.createSale({
        initiateInvoice: true,
        gatewayId: sabiflow.DEFAULT_GATEWAY_ID,
        items: [
          {
            description: `${property.name} - Property Purchase`,
            quantity: 1,
            unitPrice: price,
          }
        ],
        taxRate: 0,
        notes: `Rating: ${rating}/5. Feedback: ${feedback}`,
        paymentMethod: "credit_card",
        customerDetails: {
          name: fullName,
          email: email,
          address: `${property.location.area}, ${property.location.city}, ${property.location.state}`,
          phone: phone
        }
      });

      const currentSaleId = saleResponse.id || saleResponse._id;
      setSaleId(currentSaleId);

      // 2. Initiate Payment
      const initResponse = await sabiflow.initiatePayment(currentSaleId, sabiflow.DEFAULT_GATEWAY_ID);
      
      const { accessCode, reference } = initResponse.data;

      // 3. Update Paystack Config (this will trigger useEffect)
      setPaystackConfig({
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email,
        amount: price * 100,
        reference,
        access_code: accessCode,
        firstname: firstName,
        lastname: lastName,
        phone: phone,
      });

    } catch (error: unknown) {
      console.error("Error initiating payment process:", error);
      toast.error("Failed to initiate payment. Please try again.");
      setIsSubmitting(false);
      setPaymentStatus("idle");
    }
  };

  const handleDownloadReceipt = async () => {
    if (!saleId) return;
    try {
      await sabiflow.downloadReceipt(saleId);
      toast.success("Receipt downloading...");
    } catch (error: unknown) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-6 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto" aria-describedby="property-payment-description">
          
          {paymentStatus === "paid" ? (
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <FiCheckCircle className="text-green-500" size={64} />
              </div>
              <div>
                <h2 className="text-2xl font-bold dark:text-white text-gray-900">Payment Successful!</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Thank you for your purchase. Your payment for <strong>{property.name}</strong> has been confirmed.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDownloadReceipt}
                  className="flex items-center justify-center gap-2 w-full bg-[#703BF7] hover:bg-[#5c2fe0] text-white font-medium py-3 rounded-md transition-colors"
                >
                  <FiDownload /> Download Receipt
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="w-full border border-gray-600/30 dark:text-white text-gray-900 font-medium py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
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

              <p id="property-payment-description" className="sr-only">Complete your property payment securely. All details are required for processing.</p>
              
              <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-xs font-bold text-blue-500 uppercase mb-2 flex items-center gap-2">
                  <FiInfo /> Safety Tips & Payment Info
                </h4>
                <ul className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
                  <li>Ensure your daily transfer limit covers the total amount.</li>
                  <li>Payments above ₦5M should be handled via direct bank transfer.</li>
                  <li>Download your receipt immediately after successful verification.</li>
                </ul>
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
                    <span className="text-gray-600 dark:text-gray-400">Property Cost</span>
                    <span className="font-medium dark:text-white text-gray-900">₦{pricing.PropertyCost.toLocaleString()}</span>
                  </div>
                  {pricing.LegalFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Legal Fee</span>
                      <span className="font-medium dark:text-white text-gray-900">₦{pricing.LegalFee.toLocaleString()}</span>
                    </div>
                  )}
                  {pricing.AgentFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Agent Fee</span>
                      <span className="font-medium dark:text-white text-gray-900">₦{pricing.AgentFee.toLocaleString()}</span>
                    </div>
                  )}
                  {pricing.ServiceFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Service Fee</span>
                      <span className="font-medium dark:text-white text-gray-900">₦{pricing.ServiceFee.toLocaleString()}</span>
                    </div>
                  )}
                  {pricing.CautionFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Caution Fee</span>
                      <span className="font-medium dark:text-white text-gray-900">₦{pricing.CautionFee.toLocaleString()}</span>
                    </div>
                  )}
                  
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
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PropertyPaymentModal;
