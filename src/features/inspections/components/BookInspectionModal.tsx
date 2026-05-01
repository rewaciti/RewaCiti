import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useInspectionStore } from "../store/useInspectionStore";
import type { Property } from "../../../types";
import { FiX, FiMapPin } from "react-icons/fi";
import axios from "axios";
import { Link } from "react-router";
import { toast } from "sonner";
import PaystackPop from "@paystack/inline-js";

interface BookInspectionModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GATEWAY_ID = "69ed740cc09e9388ba096d02";
const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_SABIFLOW_API_KEY;

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
  const propertyUrl = window.location.href;

  const handleDownloadReceipt = async (saleId: string) => {
    try {
      const response = await axios.get(`${API_URL}/sales/${saleId}/invoice/download?format=pdf`, {
        headers: { "x-api-key": API_KEY },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${saleId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt. Please contact support.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Sale
      const salePayload = {
        initiateInvoice: true,
        gatewayId: GATEWAY_ID,
        items: [
          {
            description: `Inspection Fee: ${property.name}`,
            quantity: 1,
            unitPrice: amount
          }
        ],
        taxRate: 0,
        notes: `Property Visit/Inspection\nProperty Link: ${propertyUrl}`,
        paymentMethod: "credit_card",
        customerDetails: {
          name: fullName,
          email: email,
          address: propertyAddress,
          phone: phone
        }
      };

      const saleResponse = await axios.post(`${API_URL}/sales`, salePayload, {
        headers: { "x-api-key": API_KEY }
      });

      const saleId = saleResponse.data.id || saleResponse.data._id;

      // 2. Initialize Payment
      const initResponse = await axios.post(`${API_URL}/sales/${saleId}/payment/initiate`, {
        gatewayId: GATEWAY_ID
      }, {
        headers: { "x-api-key": API_KEY }
      });

      const accessCode = initResponse.data.data.accessCode;

      // 3. Open Paystack Modal
      const paystack = new PaystackPop();
      paystack.resumeTransaction(accessCode, {
        onSuccess: async (transaction: any) => {
          setIsSubmitting(true);
          try {
            // 4. Verify Payment - Including gatewayId in case it's required for verification
            await axios.post(`${API_URL}/sales/${saleId}/payment/verify`, {
              gatewayId: GATEWAY_ID
            }, {
              headers: { "x-api-key": API_KEY }
            });

            // 5. CRM and Local Store
            const crmPayload = {
              companyId: "69b4712ce95a2df514b1c789",
              pipelineId: "69ed7a4ac09e9388ba096f1f",
              title: `VISIT BOOKING: ${property.name} - ${fullName}`,
              name: fullName,
              amount: amount, // Changed from string to numeric amount
              email: email,
              phone: phone,
              address: propertyAddress,
              note: `Reference: ${transaction.reference}\nTask: Property Visit/Inspection\nProperty Link: ${propertyUrl}\nSale ID: ${saleId}`,
              customData: [
                { label: "Property Name", value: property.name },
                { label: "Property Link", value: propertyUrl },
                { label: "Booking Reference", value: transaction.reference },
                { label: "Inspection Fee", value: `₦${amount.toLocaleString()}` },
                { label: "Agent ID", value: property.createdBy.toString() },
                { label: "Property ID", value: property.id },
                { label: "Category", value: property.category },
                { label: "Sale ID", value: saleId }
              ]
            };

            console.log("Submitting CRM Payload:", crmPayload);
            await axios.post("https://api.sabiflow.com/api/crm/deals/guest", crmPayload);
            console.log("CRM submission successful");

            addInspection({
              propertyId: property.id,
              propertyName: property.name,
              userName: fullName,
              userEmail: email,
              userPhone: phone,
              date: new Date().toISOString().split('T')[0],
              time: new Date().toLocaleTimeString(),
              amount,
              reference: transaction.reference,
              location: propertyAddress,
            });

            updatePaymentStatus(transaction.reference, "paid");
            
            toast.success(`Visit booked successfully! Reference: ${transaction.reference}`, {
              duration: 5000,
            });

            // 6. Download Receipt
            await handleDownloadReceipt(saleId);

            onOpenChange(false);
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
          } catch (error) {
            console.error("Verification/CRM error:", error);
            toast.error("Payment successful, but verification failed. Please contact support.");
          } finally {
            setIsSubmitting(false);
          }
        },
        onCancel: () => {
          toast.info("Payment cancelled.");
          setIsSubmitting(false);
        }
      });

    } catch (error: any) {
      console.error("Payment flow error:", error);
      toast.error(error.response?.data?.message || "An error occurred during the payment process.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-6 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto" aria-describedby="inspection-modal-description">
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

          <p id="inspection-modal-description" className="sr-only">Book a property inspection and pay securely using Paystack. All details are required for processing.</p>
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
                A verified agent will be assigned and our team will contact you within{" "}
                <span className="font-semibold text-[#703BF7]">24 hours</span> to confirm your property details and schedule a suitable viewing time.
              </p>

              <p className="text-sm dark:text-gray-300 text-gray-700 text-center mt-1">
                For your security and a seamless experience, all communication and scheduling will be handled by our team. Agent contact details will not be shared directly.
              </p>
            </div>

            <div className="p-3 bg-[#703BF7]/10 rounded-lg border border-[#703BF7]/30 space-y-2">
              <div className="border-b border-[#703BF7]/20 pb-2 mb-2">
                <h4 className="font-semibold dark:text-white text-gray-900">{property.name}</h4>
                <p className="text-xs dark:text-gray-400 text-gray-600">{property.category} • {property.bedrooms} Bedrooms</p>
              </div>
              <div className="flex items-start gap-2 text-sm dark:text-gray-300 text-gray-700">
                <FiMapPin className="text-[#703BF7] mt-1 shrink-0" />
                <span>{property.location.area}, {property.location.city}, {property.location.state}</span>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BookInspectionModal;
