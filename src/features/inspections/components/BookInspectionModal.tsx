import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useInspectionStore } from "../store/useInspectionStore";
import type { Property } from "../../../types";
import { FiX, FiMapPin, FiCheckCircle, FiDownload, FiInfo } from "react-icons/fi";
import axios from "axios";
import { Link } from "react-router";
import { toast } from "sonner";
import { usePaystackPayment } from "react-paystack";
import * as sabiflow from "../../../shared/lib/sabiflow";

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
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "paid" | "failed">("idle");
  const [saleId, setSaleId] = useState<string | null>(null);
  const [paystackConfig, setPaystackConfig] = useState<any>({
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  });

  const addInspection = useInspectionStore((state) => state.addInspection);
  const updatePaymentStatus = useInspectionStore((state) => state.updatePaymentStatus);
  const fees = useInspectionStore((state) => state.fees);
  const loading = useInspectionStore((state) => state.loading);
  const fetchFees = useInspectionStore((state) => state.fetchFees);

  useEffect(() => {
    if (open && !fees) {
      fetchFees();
    }
  }, [open, fees, fetchFees]);

  const normalizedCity = property.location.city?.toLowerCase().replace(/\s+/g, "-") ?? "";
  const normalizedState = property.location.state?.toLowerCase().replace(/\s+/g, "-") ?? "";
  const amount = fees?.[normalizedState]?.[normalizedCity] ?? fees?.default ?? 5000;

  const fullName = `${firstName} ${lastName}`.trim();
  const propertyAddress = `${property.location.area}, ${property.location.city}, ${property.location.state}`;

  const handlePaymentSuccess = async () => {
    if (!saleId) return;
    
    setIsSubmitting(true);
    try {
      await sabiflow.verifyPayment(saleId);
      setPaymentStatus("paid");
      
      // Update local store
      addInspection({
        propertyId: property.id,
        propertyName: property.name,
        userName: fullName,
        userEmail: email,
        userPhone: phone,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        amount,
        reference: saleId,
        location: propertyAddress,
      });
      updatePaymentStatus(saleId, "paid");

      // Also send to CRM deal for tracking as before
      const payload = {
        companyId: "69b4712ce95a2df514b1c789",
        pipelineId: "69ed7a4ac09e9388ba096f1f",
        title: `VISIT BOOKING: ${property.name} - ${fullName}`,
        name: fullName,
        amount: amount,
        email: email,
        phone: phone,
        address: propertyAddress,
        note: `Sale ID: ${saleId}\nTask: Property Visit/Inspection`,
        customData: [
          { label: "Property Name", value: property.name },
          { label: "Sale ID", value: saleId },
          { label: "Inspection Fee", value: `₦${amount.toLocaleString()}` },
          { label: "Agent ID", value: property.createdBy.toString() },
          { label: "Property ID", value: property.id },
          { label: "Category", value: property.category }
        ]
      };
      await axios.post("https://api.sabiflow.com/api/crm/deals/guest", payload);

      toast.success("Booking confirmed successfully!");
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast.error("Failed to verify payment. Please contact support.");
      setPaymentStatus("failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaystackClose = () => {
    toast.info("Payment window closed.");
    setIsSubmitting(false);
    setPaymentStatus("idle");
  };

  const initializePaystack = usePaystackPayment(paystackConfig);

  // Trigger Paystack when config is updated with accessCode
  useEffect(() => {
    if (paystackConfig.access_code && paymentStatus === "pending") {
      initializePaystack({
        onSuccess: handlePaymentSuccess,
        onClose: handlePaystackClose
      });
    }
  }, [paystackConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    setIsSubmitting(true);
    setPaymentStatus("pending");

    try {
      // 1. Create Sale
      const saleResponse = await sabiflow.createSale({
        initiateInvoice: true,
        gatewayId: import.meta.env.VITE_PAYSTACK_GATEWAY_ID,
        items: [
          {
            description: `${property.name} - Visit Booking`,
            quantity: 1,
            unitPrice: amount,
            inventoryItemId: property.id
          }
        ],
        taxRate: 0,
        notes: `Property Visit Booking for ${property.name}`,
        paymentMethod: "credit_card",
        customerDetails: {
          name: fullName,
          email: email,
          address: propertyAddress,
          phone: phone
        }
      });

      const currentSaleId = saleResponse.id || saleResponse._id;
      setSaleId(currentSaleId);

      // 2. Initiate Payment
      const initResponse = await sabiflow.initiatePayment(currentSaleId, import.meta.env.VITE_PAYSTACK_GATEWAY_ID);
      
      const { accessCode, reference } = initResponse.data;

      // 3. Update Paystack Config (this will trigger useEffect)
      setPaystackConfig({
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email,
        amount: amount * 100,
        reference,
        access_code: accessCode,
      });

    } catch (error) {
      console.error("Error initiating booking process:", error);
      toast.error("Failed to initiate booking. Please try again.");
      setIsSubmitting(false);
      setPaymentStatus("idle");
    }
  };

  const handleDownloadReceipt = async () => {
    if (!saleId) return;
    try {
      await sabiflow.downloadReceipt(saleId);
      toast.success("Receipt downloading...");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-6 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto" aria-describedby="inspection-modal-description">
          
          {paymentStatus === "paid" ? (
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <FiCheckCircle className="text-green-500" size={64} />
              </div>
              <div>
                <h2 className="text-2xl font-bold dark:text-white text-gray-900">Visit Booked!</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Your inspection for <strong>{property.name}</strong> has been scheduled. Our team will contact you shortly.
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
                  Book a Visit
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600">
                    <FiX />
                  </button>
                </Dialog.Close>
              </div>

              <p id="inspection-modal-description" className="sr-only">Book a property inspection and pay securely. All details are required for processing.</p>
              
              <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-xs font-bold text-blue-500 uppercase mb-2 flex items-center gap-2">
                  <FiInfo /> Booking Information
                </h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-400">
                  The inspection fee covers the logistics for our agent to show you the property. This fee is non-refundable but can be applied to your purchase.
                </p>
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

                <div className="p-3 bg-[#703BF7]/10 rounded-lg border border-[#703BF7]/30 space-y-2">
                  <div className="border-b border-[#703BF7]/20 pb-2 mb-2">
                    <h4 className="font-semibold dark:text-white text-gray-900">{property.name}</h4>
                    <p className="text-xs dark:text-gray-400 text-gray-600">{property.category} • {property.bedrooms} Bedrooms</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm dark:text-gray-300 text-gray-700">
                    <FiMapPin className="text-[#703BF7] mt-1 shrink-0" />
                    <span>{propertyAddress}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-[#703BF7]/20 pt-2">
                    <span className="text-sm font-medium dark:text-white text-gray-900">Inspection Fee</span>
                    <span className="text-lg font-bold text-[#703BF7]">
                      {loading && !fees ? "Loading..." : `₦${amount.toLocaleString()}`}
                    </span>
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
                  disabled={!agreed || isSubmitting || loading}
                  className={`w-full font-medium py-3 rounded-md transition-colors mt-4 disabled:opacity-50 ${
                    agreed && !isSubmitting && !loading
                      ? "bg-[#703BF7] hover:bg-[#5c2fe0] text-white"
                      : "bg-gray-400 cursor-not-allowed text-gray-200"
                  }`}
                >
                  {isSubmitting ? "Processing..." : loading ? "Loading fees..." : "Pay & Book a Visit"}
                </button>
              </form>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BookInspectionModal;
