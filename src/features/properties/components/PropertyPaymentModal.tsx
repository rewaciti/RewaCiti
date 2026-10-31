import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiInfo } from "react-icons/fi";
import type { Property } from "../../../types";
import type { PurchaseResult } from "../../../types/realEstate";
import { toast } from "sonner";
import { useAuthStore } from "../../auth/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { getCookie, setCookie } from "../../../shared/lib/utils";
import { errorMessage, noteTestMode } from "../../../shared/lib/realEstateApi";
import { payInvoice } from "../../../shared/lib/payments";
import useRequestKey from "../../../shared/hooks/useRequestKey";
import { usePropertyStore } from "../store/usePropertyStore";
import { propertiesAPI } from "../services/propertiesAPI";
import { addressOf } from "../services/toProperty";
import { Link } from "react-router";

interface PropertyPaymentModalProps {

  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: (userData: { name: string; email: string; dealNumber: string }) => void;
}

const PropertyPaymentModal: React.FC<PropertyPaymentModalProps> = ({
  property,
  open,
  onOpenChange,
  onPaymentSuccess,
}) => {
  const { isAuthenticated, customer } = useAuthStore();
  const onlineLimit = usePropertyStore((state) => state.forms?.payment.onlineLimit ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePhone, setProfilePhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [bankTransfer, setBankTransfer] = useState<PurchaseResult | null>(null);
  const modalCookieKey = "rewaciti_payment_modal";

  // Paying again after closing the popup reuses the same held place, until the hold runs out
  const requestKey = useRequestKey();
  const [heldUntil, setHeldUntil] = useState(0);

  const fullName = customer ? `${customer.firstName} ${customer.lastName}`.trim() : guestName;
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
          console.error("Failed to fetch profile in payment modal:", error);
        }
      };
      fetchProfile();
    }
  }, [open, isAuthenticated]);

  React.useEffect(() => {
    setCookie(modalCookieKey, JSON.stringify({ guestName, guestEmail, guestPhone, agreed }));
  }, [guestName, guestEmail, guestPhone, agreed]);

  const pricing = property.pricing;
  const price = pricing.total;
  const byBankTransfer = onlineLimit > 0 && price > onlineLimit;
  const propertyAddress = addressOf(property);

  const finish = () => {
    // Paying or a bank transfer holds the place, so the page should show it
    void usePropertyStore.getState().fetchPropertyBySlug(property.slug);
    requestKey.renew();
    setHeldUntil(0);
    setCookie(modalCookieKey, JSON.stringify({ guestName: "", guestEmail: "", guestPhone: "", agreed: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please enter your full name, email, and phone number to continue.");
      return;
    }

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy to continue.");
      return;
    }

    setIsSubmitting(true);
    if (heldUntil && Date.now() > heldUntil) requestKey.renew();

    try {
      // 1. Hold a place. SabiFlow works out what's owed from the listing.
      const purchase = await propertiesAPI.purchase(
        property.id,
        { name: fullName.trim(), email: email.trim(), phone: phone.trim(), consent: agreed },
        requestKey.current(),
      );
      noteTestMode(purchase);
      if (purchase.test) return;
      if (purchase.data.holdUntil) setHeldUntil(new Date(purchase.data.holdUntil).getTime());

      // Above the online limit: show where to send it, and the team confirms it
      if (purchase.bankTransfer) {
        setBankTransfer(purchase);
        finish();
        return;
      }

      const payment = purchase.data.payments.find((p) => p.status !== "paid");
      if (!payment) throw new Error("There's nothing to pay on this property.");

      // 2. Pay in the Paystack popup, or on the invoice's own page
      const outcome = await payInvoice({ invoiceId: payment.invoiceId, email: email.trim(), paymentLink: payment.paymentLink });

      if (outcome === "paid" || outcome === "pending") {
        toast.success(
          <div className="whitespace-pre-wrap">
            {outcome === "paid"
              ? `Payment successful!\nYour receipt is on its way to ${email.trim()}. A member of our team will contact you shortly.`
              : `We've received your payment.\nIt will show as paid once Paystack confirms it, and your receipt will be emailed to you.`}
          </div>,
          {
            duration: 6000,
          }
        );
        onOpenChange(false);
        finish();
        // Trigger Rating Modal
        if (outcome === "paid") {
          onPaymentSuccess?.({ name: fullName.trim(), email: email.trim(), dealNumber: purchase.data.number });
        }
      } else if (outcome === "cancelled") {
        toast.info("Payment cancelled. Your place is held for a short while if you'd like to try again.");
      } else if (outcome === "failed") {
        toast.error("The payment didn't go through. Please try again.");
      }
    } catch (error) {
      console.error("Payment flow error:", error);
      toast.error(errorMessage(error, "An error occurred during the payment process."), { duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setBankTransfer(null);
      }}
      modal={false}
    >
      <Dialog.Portal>
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md dark:bg-[#1A1A1A] bg-white border border-gray-600/30 p-4 rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto center-modal-animate" aria-describedby="property-payment-description">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-semibold dark:text-white text-gray-900">
              {bankTransfer ? "Pay by Bank Transfer" : "Pay for Property"}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Complete your payment for {property.name} securely.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-400 text-gray-600">
                <FiX />
              </button>
            </Dialog.Close>
          </div>

          <p id="property-payment-description" className="sr-only">Complete your property payment securely. All details are required for processing.</p>

          <div className="mb-3 p-3 bg-gray-500/10 border border-gray-600/30 rounded-lg">
            <h4 className="text-sm font-semibold dark:text-white text-gray-900 mb-2">Property Details</h4>
            <div className="space-y-1">
              <p className="text-sm dark:text-gray-300 text-gray-700">
                <span className="font-medium">Name:</span> {property.name}
              </p>
              <p className="text-sm dark:text-gray-300 text-gray-700">
                <span className="font-medium">Location:</span> {propertyAddress}
              </p>
              {property.duration && (
                <p className="text-sm dark:text-gray-300 text-gray-700">
                  <span className="font-medium">Duration:</span> {property.duration}
                </p>
              )}
            </div>
          </div>

          {bankTransfer?.bankTransfer ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#703BF7]/10 rounded-lg border border-[#703BF7]/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="text-lg font-bold text-[#703BF7]">₦{bankTransfer.bankTransfer.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Payment reference</span>
                  <span className="font-semibold dark:text-white text-gray-900">{bankTransfer.data.number}</span>
                </div>
                {bankTransfer.bankTransfer.details && (
                  <div className="border-t border-[#703BF7]/20 pt-3">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Pay into</p>
                    <p className="text-sm dark:text-white text-gray-900 whitespace-pre-line">{bankTransfer.bankTransfer.details}</p>
                  </div>
                )}
              </div>
              <p className="text-sm dark:text-gray-300 text-gray-700">{bankTransfer.message}</p>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  setBankTransfer(null);
                }}
                className="w-full font-medium py-3 rounded-md transition-colors bg-[#703BF7] hover:bg-[#5c2fe0] text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-xs font-bold text-blue-500 uppercase mb-2 flex items-center gap-2">
                  <FiInfo /> Safety Tips & Payment Info
                </h4>
                <ul className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
                  <li>Ensure your daily transfer limit covers the total amount.</li>
                  <li>High-value transactions may require additional bank authorization.</li>
                  {onlineLimit > 0 && <li>Payments above ₦{onlineLimit.toLocaleString()} are made by direct bank transfer.</li>}
                  <li>Your receipt is emailed to you once the payment is confirmed.</li>
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isAuthenticated && customer ? (
                  <div className="p-3 bg-gray-500/10 border border-gray-600/30 rounded-lg space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Billing Information</h4>
                    <div className="text-sm dark:text-gray-300 text-gray-700 space-y-1">
                      <p><span className="font-semibold">Name:</span> {fullName}</p>
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

                <div className="p-3 bg-gray-500/10 border border-gray-600/30 rounded-lg">
                  <p className="text-sm dark:text-gray-300 text-gray-700 text-center">
                    Once your payment is confirmed, a verified agent will be assigned and our team will contact you within{" "}
                    <span className="font-semibold text-[#703BF7]">24 hours</span> to schedule a meeting for necessary documentation and activities.
                  </p>
                </div>

                {/* Breakdown Section */}
                <div className="p-4 bg-gray-500/10 border border-gray-600/30 rounded-lg space-y-3">
                  <h3 className="text-sm font-semibold dark:text-white text-gray-900 flex items-center gap-2">
                    <FiInfo className="text-[#703BF7]" />
                    Payment Breakdown
                  </h3>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Property Cost</span>
                    <span className="font-medium dark:text-white text-gray-900">₦{pricing.base.toLocaleString()}</span>
                  </div>
                  {pricing.charges
                    .filter((charge) => charge.amount > 0)
                    .map((charge) => (
                      <div key={charge.name} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {charge.name}
                          {charge.refundable && <span className="text-xs"> (refundable)</span>}
                        </span>
                        <span className="font-medium dark:text-white text-gray-900">₦{charge.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  {pricing.serviceCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Service Charge</span>
                      <span className="font-medium dark:text-white text-gray-900">₦{pricing.serviceCharge.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold border-t border-[#703BF7]/50 pt-2 text-[#703BF7]">
                    <span>Total Due</span>
                    <span>₦{price.toLocaleString()}</span>
                  </div>
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
                  disabled={isSubmitting || !fullName.trim() || !email.trim() || !phone.trim() || !agreed}
                  className={`w-full font-medium py-3 rounded-md transition-colors mt-3 disabled:opacity-50 ${isSubmitting || !fullName.trim() || !email.trim() || !phone.trim() || !agreed
                    ? "bg-gray-400 cursor-not-allowed text-gray-200"
                    : "bg-[#703BF7] hover:bg-[#5c2fe0] text-white cursor-pointer"
                    }`}
                >
                  {isSubmitting
                    ? "Processing..."
                    : byBankTransfer
                      ? "Get Bank Transfer Details"
                      : `Pay Total: ₦${price.toLocaleString()}`}
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
