import React, { useState } from "react";
import { useAuthStore } from "../../auth/store/useAuthStore";
import * as Dialog from "@radix-ui/react-dialog";
import { useInspectionStore } from "../store/useInspectionStore";
import type { Property } from "../../../types";
import { FiX, FiMapPin } from "react-icons/fi";
import axios from "axios";
import { toast } from "sonner";
import PaystackPop from "@paystack/inline-js";
import { COMPANY_ID } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { getCookie, setCookie } from "../../../shared/lib/utils";
import { Link } from "react-router";

interface BookInspectionModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_SABIFLOW_API_KEY;
const GATEWAY_ID = import.meta.env.VITE_SABIFLOW_GATEWAY_ID;
const INSPECTION_BOOKING_NOTICE_HOURS = 48;

// Hourly slots from 08:00 to 16:00 (stored as 24h "HH:00", displayed in 12h)
const VISIT_SLOTS = Array.from({ length: 9 }, (_, i) =>
  `${String(i + 8).padStart(2, "0")}:00`,
);

const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const isWeekendDate = (date: string) => {
  if (!date) return false;
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 || day === 6;
};

const formatTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const formatTwelveHourTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
};

const getVisitBookingConstraints = () => {
  const now = new Date();
  const earliestVisit = new Date(
    Math.ceil(
      (now.getTime() + INSPECTION_BOOKING_NOTICE_HOURS * 60 * 60 * 1000) / 60000,
    ) * 60000,
  );
  const minDate = new Date(
    earliestVisit.getFullYear(),
    earliestVisit.getMonth(),
    earliestVisit.getDate(),
  );

  if (earliestVisit.getHours() > 16 ||
      (earliestVisit.getHours() === 16 && earliestVisit.getMinutes() > 0)) {
    minDate.setDate(minDate.getDate() + 1);
  }

  while (minDate.getDay() === 0 || minDate.getDay() === 6) {
    minDate.setDate(minDate.getDate() + 1);
  }

  const minTime =
    formatLocalDate(minDate) === formatLocalDate(earliestVisit) &&
    earliestVisit.getHours() >= 8
      ? formatTime(earliestVisit)
      : "08:00";

  return { minDate: formatLocalDate(minDate), minTime };
};

interface PaystackSuccessResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  message: string;
}

const BookInspectionModal: React.FC<BookInspectionModalProps> = ({
  property,
  open,
  onOpenChange,
}) => {
  const { isAuthenticated, customer, token } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePhone, setProfilePhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const modalCookieKey = "rewaciti_inspection_modal";

  const phone = profilePhone || customer?.phoneNumber || guestPhone;
  const { minDate: minVisitDate, minTime: earliestVisitTime } =
    getVisitBookingConstraints();
  const earliestTimeForDate =
    visitDate === minVisitDate ? earliestVisitTime : "08:00";
  const [earliestHour, earliestMinute] = earliestTimeForDate
    .split(":")
    .map(Number);
  const firstAvailableTime = `${String(
    earliestHour + (earliestMinute > 0 ? 1 : 0),
  ).padStart(2, "0")}:00`;

  // Hourly slots (8 AM - 4 PM) that respect the 48-hour notice on the earliest day
  const availableSlots = VISIT_SLOTS.filter((t) => t >= firstAvailableTime);

  React.useEffect(() => {
    if (
      visitTime &&
      (visitTime < firstAvailableTime ||
        visitTime > "16:00" ||
        Number(visitTime.slice(3, 5)) !== 0)
    ) {
      setVisitTime("");
    }
  }, [visitTime, firstAvailableTime]);

  React.useEffect(() => {
    const savedForm = getCookie(modalCookieKey);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        setGuestName(parsed.guestName || "");
        setGuestEmail(parsed.guestEmail || "");
        setGuestPhone(parsed.guestPhone || "");
        setAgreed(parsed.agreed || false);
        const savedVisitDate = parsed.visitDate || "";
        setVisitDate(isWeekendDate(savedVisitDate) ? "" : savedVisitDate);
        const savedVisitTime =
          isWeekendDate(savedVisitDate)
            ? ""
            : parsed.visitTime ||
              (parsed.visitHour && parsed.visitMinute
                ? `${parsed.visitHour}:${parsed.visitMinute}`
                : "");
        setVisitTime(savedVisitTime);
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
          console.error("Failed to fetch profile in book visit modal:", error);
        }
      };
      fetchProfile();
    }
  }, [open, isAuthenticated]);

  React.useEffect(() => {
    setCookie(modalCookieKey, JSON.stringify({
      guestName,
      guestEmail,
      guestPhone,
      agreed,
      visitDate,
      visitTime,
    }));
  }, [guestName, guestEmail, guestPhone, agreed, visitDate, visitTime]);

  const addInspection = useInspectionStore((state) => state.addInspection);
  const updatePaymentStatus = useInspectionStore((state) => state.updatePaymentStatus);

  const amount = property.visitationfee;
  const feeDisplay = amount === 0 ? "inspection is free" : `₦${amount.toLocaleString()}`;

  const fullName = customer ? `${customer.firstName} ${customer.lastName}`.trim() : guestName;
  const bookingEmail = customer?.email ?? guestEmail;

  const propertyAddress = `${property.location.area}, ${property.location.city_town}, ${property.location.state} state.`;
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

    if (!fullName.trim() || !bookingEmail.trim() || !phone.trim()) {
      toast.error("Please enter your full name, email, and phone number to continue.");
      return;
    }

    if (!visitDate || !visitTime) {
      toast.error("Please select your preferred visit date and time.");
      return;
    }

    if (isWeekendDate(visitDate)) {
      toast.error("Please choose a weekday for your visit.");
      return;
    }

    const selectedVisit = new Date(`${visitDate}T${visitTime}:00`);
    const minimumNoticeMs = INSPECTION_BOOKING_NOTICE_HOURS * 60 * 60 * 1000;
    if (
      Number.isNaN(selectedVisit.getTime()) ||
      visitTime < "08:00" ||
      visitTime > "16:00" ||
      !visitTime.endsWith(":00") ||
      selectedVisit.getTime() < Date.now() + minimumNoticeMs
    ) {
      toast.error(
        "Choose a visit between 8:00 AM and 4:00 PM, at least 48 hours from now.",
      );
      return;
    }

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy to continue.");
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
            description: `Inspection Fee: ${property.name}, ${propertyAddress}`,
            quantity: 1,
            unitPrice: amount,
            inventoryItemId: undefined,
            productId: undefined,
          }
        ],
        taxRate: 0,
        notes: `Inspection booking for ${property.name} at ${propertyAddress}.\nPreferred Visit: ${visitDate} at ${formatTwelveHourTime(visitTime)}\nProperty Link: ${propertyUrl}`,
        paymentMethod: "credit_card",
        customerDetails: {
          name: fullName,
          email: bookingEmail,
          phone: phone
        }
      };

      const saleResponse = await axios.post(`${API_URL}/sales`, salePayload, {
        headers: {
          "x-api-key": API_KEY,
          Authorization: `Bearer ${token}`,
        },
      });

      const saleId = saleResponse.data.id || saleResponse.data._id;

      // 2. Initialize Payment
      const initResponse = await axios.post(`${API_URL}/sales/${saleId}/payment/initiate`, {
        gatewayId: GATEWAY_ID,
        initiateGateway: true,
      }, {
        headers: {
          "x-api-key": API_KEY,
          Authorization: `Bearer ${token}`,
        },
      });

      const accessCode = initResponse.data.data.accessCode;

      // 3. Open Paystack Modal
      const paystack = new PaystackPop();
      paystack.resumeTransaction(accessCode, {
        onSuccess: async (transaction: PaystackSuccessResponse) => {
          setIsSubmitting(true);
          try {
            // 4. Verify Payment - Including gatewayId in case it's required for verification
            await axios.post(`${API_URL}/sales/${saleId}/payment/verify`, {
              gatewayId: GATEWAY_ID
            }, {
              headers: {
                "x-api-key": API_KEY,
                Authorization: `Bearer ${token}`,
              },
            });

            // 5. CRM and Local Store
            const crmPayload = {
              companyId: COMPANY_ID,
              pipelineId: "6a4c98cbeb058fac4420ea43",
              title: `VISIT BOOKING: ${property.name} - ${fullName}`,
              name: fullName,
              amount: amount, // Changed from string to numeric amount
              email: bookingEmail,
              phone: phone,
              address: propertyAddress,
              note: `visit/inspection booking for ${property.name} at ${propertyAddress}.\nPreferred Visit: ${visitDate} at ${formatTwelveHourTime(visitTime)}\nProperty Link: ${propertyUrl}.\nBooking Reference: ${transaction.reference}`,
              customData: [
                { label: "Property Name", value: property.name },
                { label: "Preferred Visit Date", value: visitDate },
                { label: "Preferred Visit Time", value: formatTwelveHourTime(visitTime) },
                { label: "Property Link", value: propertyUrl },
                { label: "Booking Reference", value: transaction.reference },
                { label: "Inspection Fee", value: `₦${amount.toLocaleString()}` },
                ...(property.createdBy?._id || property.createdBy?.id
                  ? [
                    {
                      label: "Agent ID",
                      value: property.createdBy._id ?? property.createdBy.id,
                    },
                  ]
                  : []),
                { label: "Property ID", value: property.id },
                { label: "Category", value: property.category },
                { label: "Sale ID", value: saleId },
                ...(property.caretakerContact?.whatsapp ? [{ label: "Caretaker WhatsApp", value: property.caretakerContact.whatsapp }] : []),
                ...(property.caretakerContact?.phone ? [{ label: "Caretaker Phone", value: property.caretakerContact.phone }] : [])
              ]
            };

            console.log("Submitting CRM Payload:", crmPayload);
            await axios.post("https://api.sabiflow.com/api/crm/deals/guest", crmPayload);
            console.log("CRM submission successful");

            addInspection({
              propertyId: property.id,
              propertyName: property.name,
              userName: fullName,
              userEmail: bookingEmail,
              userPhone: phone,
              date: new Date().toISOString().split('T')[0],
              time: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
              amount,
              reference: transaction.reference,
              location: propertyAddress,
            });

            updatePaymentStatus(transaction.reference, "paid");

            toast.success(
              <div className="whitespace-pre-wrap">
                {`Payment successful! \nA member of our team will contact you shortly.`}
              </div>,
              {
                duration: 5000,
              }
            );

            // 6. Download Receipt
            await handleDownloadReceipt(saleId);

            onOpenChange(false);
            setCookie(modalCookieKey, JSON.stringify({ guestName: "", guestEmail: "", guestPhone: "", agreed: false, visitDate: "", visitTime: "" }));
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

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Payment flow error:", error);
        const errorMessage = error.response?.data?.message || "";

        if (errorMessage.toLowerCase().includes("stock") || errorMessage.toLowerCase().includes("available")) {
          toast.error("This property is no longer available. Please check out our other listings.", {
            duration: 6000,
          });
        } else {
          toast.error(errorMessage || "An error occurred during the payment process.");
        }
      } else {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-4 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto center-modal-animate" aria-describedby="inspection-modal-description">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-semibold dark:text-white text-gray-900">
              Book a Visit
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Schedule a visit to {property.name} and pay the inspection fee securely.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600">
                <FiX />
              </button>
            </Dialog.Close>
          </div>

          <p id="inspection-modal-description" className="sr-only">Book a property inspection and pay securely using Paystack. All details are required for processing.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isAuthenticated && customer ? (
              <div className="p-3 bg-gray-500/10 border border-gray-600/30 rounded-lg space-y-1">
                <p className="text-xs dark:text-gray-400 text-gray-600 mb-1">Booking as</p>
                <p className="text-sm font-medium dark:text-white text-gray-900">
                  {fullName}
                </p>
                <p className="text-sm dark:text-gray-300 text-gray-700">
                  {bookingEmail}
                </p>
                <p className="text-sm dark:text-gray-300 text-gray-700">
                  {phone || <span className="italic text-red-500">No phone number listed in profile</span>}
                </p>
              </div>
            ) : (
              <div className="space-y-1 rounded-lg border border-gray-600/30 bg-gray-500/10 p-2">
                <div>
                  <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-md border border-gray-600/30 bg-white/80 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-[#703BF7] dark:bg-[#1A1A1A] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-600/30 bg-white/80 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-[#703BF7] dark:bg-[#1A1A1A] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full rounded-md border border-gray-600/30 bg-white/80 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-[#703BF7] dark:bg-[#1A1A1A] dark:text-white"
                  />
                </div>
              </div>
            )}

           <div className="space-y-2 border border-gray-600/30 rounded-lg p-3 bg-gray-500/10">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Preferred Date</label>
                  <input
                    type="date"
                    required
                    min={minVisitDate}
                    value={visitDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      if (isWeekendDate(selectedDate)) {
                        setVisitDate("");
                        setVisitTime("");
                        toast.error("Please choose a weekday for your visit.");
                        return;
                      }
                      setVisitDate(selectedDate);
                    }}
                    className="w-full rounded-md border border-gray-600/30 bg-white/80 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-[#703BF7] dark:bg-[#1A1A1A] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Preferred Time</label>
                  <select
                    required
                    disabled={!visitDate}
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full rounded-md border border-gray-600/30 bg-white/80 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-[#703BF7] disabled:opacity-60 dark:bg-[#1A1A1A] dark:text-white"
                  >
                    <option value="" disabled>
                      {visitDate ? "Select time" : "Pick a date first"}
                    </option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {formatTwelveHourTime(slot)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs dark:text-gray-400 leading-snug text-gray-500">
                Inspections are available from 8:00 AM to 4:00 PM and must be booked at least 48 hours in advance. This is your preferred slot — if the agent isn't available, our team will reach out to reschedule.
              </p>
           </div>

           <div className="p-2 bg-gray-500/10 border border-gray-600/30 rounded-lg">
              <p className="text-sm dark:text-gray-300 text-gray-700 text-center">
                A member of our team will contact you within{" "}
                <span className="font-semibold text-[#703BF7]">24 hours</span> to confirm your property details and schedule a suitable viewing time.
              </p>
            </div>

            <div className="p-2 bg-[#703BF7]/10 rounded-lg border border-[#703BF7]/30 space-y-2">
              <div className="border-b border-[#703BF7]/20 pb-2 mb-2">
                <h4 className="font-semibold dark:text-white text-gray-900">{property.name}</h4>
                <p className="text-xs dark:text-gray-400 text-gray-600">{property.category} • {property.bedrooms} Bedrooms</p>
              </div>
              <div className="flex items-start gap-2 text-sm dark:text-gray-300 text-gray-700">
                <FiMapPin className="text-[#703BF7] mt-1 shrink-0" />
                <span>{property.location.area}, {property.location.city_town}, {property.location.state} state.</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#703BF7]/20 pt-2">
                <span className="text-sm font-medium dark:text-white text-gray-900">Inspection Fee</span>
                <span className="text-lg font-bold text-[#703BF7]">
                  {feeDisplay}
                </span>
              </div>
              <p className="text-xs text-[#703BF7] dark:text-[#a78bfa] leading-snug font-semibold">
                {amount === 0
                  ? "Since there's no inspection fee, you'll cover your own transportation — but you're free to view as many available properties as you like."
                  : "This fee covers a visit to up to 2 properties. If you'd like to view more, you'll need to cover transportation for the additional visits."}
              </p>
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
              disabled={isSubmitting || !fullName.trim() || !bookingEmail.trim() || !phone.trim() || !visitDate || !visitTime || !agreed}
              className={`w-full font-medium py-3 rounded-md transition-colors mt-4 disabled:opacity-50 ${isSubmitting || !fullName.trim() || !bookingEmail.trim() || !phone.trim() || !visitDate || !visitTime || !agreed
                ? "bg-gray-400 cursor-not-allowed text-gray-200"
                : "bg-[#703BF7] hover:bg-[#5c2fe0] text-white cursor-pointer"
                }`}
            >
              {isSubmitting ? "Processing..." : "Pay & Book a Visit"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BookInspectionModal;