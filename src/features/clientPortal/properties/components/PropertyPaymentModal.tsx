import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiInfo, FiChevronDown } from "react-icons/fi";
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

// Same serif as the Navbar (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#703BF7] focus:ring-2 focus:ring-[#703BF7]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-900 dark:text-white";
const boxClass = "rounded-2xl bg-gray-100 p-4 dark:bg-white/5";
const mutedClass = "text-gray-600 dark:text-gray-400";
const primaryButtonClass =
  "w-full cursor-pointer rounded-full bg-[#703BF7] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#9677df] disabled:cursor-not-allowed disabled:opacity-50";

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

  const canSubmit = !isSubmitting && !!fullName.trim() && !!email.trim() && !!phone.trim() && agreed;

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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm dialog-overlay-animate" />
        <Dialog.Content
          className="property-dialog-content responsive-sheet-animate fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-t-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl outline-none dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
          aria-describedby="property-payment-description"
        >
          <div className="sticky top-0 z-20 border-b border-gray-200 bg-white px-5 py-5 dark:border-white/10 dark:bg-[#1A1A1A] sm:px-6">
          <div className="property-dialog-header flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title style={SERIF} className="text-2xl font-semibold">
                {bankTransfer ? "Pay by bank transfer" : "Pay for this property"}
              </Dialog.Title>
              <p className={`property-dialog-subtitle mt-1 truncate ${mutedClass}`}>
                {property.name}
              </p>
            </div>
            <Dialog.Description className="sr-only">
              Complete your payment for {property.name} securely.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="cursor-pointer rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <FiX size={20} />
              </button>
            </Dialog.Close>
          </div>
          </div>

          <p id="property-payment-description" className="sr-only">
            Complete your property payment securely. All details are required for processing.
          </p>

          <div className="px-5 pb-6 pt-5 sm:px-6">
            {bankTransfer?.bankTransfer ? (
              <div className="space-y-5">
                <div className={`${boxClass} space-y-3`}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className={`text-sm ${mutedClass}`}>Amount</span>
                    <span className="text-xl font-semibold text-[#703BF7] dark:text-[#b79bff]">
                      ₦{bankTransfer.bankTransfer.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className={`text-sm ${mutedClass}`}>Payment reference</span>
                    <span className="font-semibold">{bankTransfer.data.number}</span>
                  </div>
                  {bankTransfer.bankTransfer.details && (
                    <div className="border-t border-gray-300 pt-3 dark:border-white/10">
                      <p className={`mb-1 text-sm ${mutedClass}`}>Pay into</p>
                      <p className="whitespace-pre-line text-sm font-medium">
                        {bankTransfer.bankTransfer.details}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                  {bankTransfer.message}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    setBankTransfer(null);
                  }}
                  className={primaryButtonClass}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Property summary */}
                <div className={boxClass}>
                  <p style={SERIF} className="text-lg font-semibold">
                    {property.name}
                  </p>
                  <p className={`mt-1 text-sm ${mutedClass}`}>
                    {propertyAddress}
                    {property.duration ? ` · ${property.duration}` : ""}
                  </p>
                </div>

                {/* Billing information */}
                {isAuthenticated && customer ? (
                  <div className={boxClass}>
                    <h4 className="mb-2 text-sm font-semibold">Billing information</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className={mutedClass}>Name</dt>
                        <dd className="text-right font-medium">{fullName}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className={mutedClass}>Email</dt>
                        <dd className="break-all text-right font-medium">{email}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className={mutedClass}>Phone</dt>
                        <dd className="text-right font-medium">
                          {phone || (
                            <span className="font-normal italic text-red-500">
                              No phone number in your profile
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass} htmlFor="pay-name">
                        Full name <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="pay-name"
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="pay-email">
                        Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="pay-email"
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="pay-phone">
                        Phone number <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="pay-phone"
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="0803 123 4567"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {/* Payment breakdown */}
                <div className={boxClass}>
                  <h3 className="mb-3 text-sm font-semibold">Payment breakdown</h3>
                  <dl className="space-y-2 border-b border-gray-300 pb-3 dark:border-white/10">
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <dt className={mutedClass}>Property cost</dt>
                      <dd>₦{pricing.base.toLocaleString()}</dd>
                    </div>
                    {pricing.charges
                      .filter((charge) => charge.amount > 0)
                      .map((charge) => (
                        <div
                          key={charge.name}
                          className="flex items-baseline justify-between gap-4 text-sm"
                        >
                          <dt className={mutedClass}>
                            {charge.name}
                            {charge.refundable && <span className="text-xs"> (refundable)</span>}
                          </dt>
                          <dd>₦{charge.amount.toLocaleString()}</dd>
                        </div>
                      ))}
                    {pricing.serviceCharge > 0 && (
                      <div className="flex items-baseline justify-between gap-4 text-sm">
                        <dt className={mutedClass}>Service charge</dt>
                        <dd>₦{pricing.serviceCharge.toLocaleString()}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-3 flex items-baseline justify-between gap-4 font-semibold">
                    <span>Total due</span>
                    <span className="text-lg">₦{price.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-center text-sm leading-6 text-gray-700 dark:text-gray-300">
                  Once your payment is confirmed, a verified agent will be assigned and our team
                  will contact you within{" "}
                  <span className="font-semibold text-[#703BF7] dark:text-[#b79bff]">24 hours</span>{" "}
                  to schedule a meeting for necessary documentation and activities.
                </p>

                {/* Safety tips, collapsed by default */}
                <details className="group rounded-2xl border border-gray-200 px-4 py-3 dark:border-white/10">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
                    <span className="flex items-center gap-2">
                      <FiInfo className="text-[#703BF7] dark:text-[#b79bff]" /> Safety tips &amp;
                      payment info
                    </span>
                    <FiChevronDown className="transition group-open:rotate-180" />
                  </summary>
                  <ul className={`mt-3 list-disc space-y-1.5 pl-5 text-xs leading-5 ${mutedClass}`}>
                    <li>Ensure your daily transfer limit covers the total amount.</li>
                    <li>High-value transactions may require additional bank authorization.</li>
                    {onlineLimit > 0 && (
                      <li>
                        Payments above ₦{onlineLimit.toLocaleString()} are made by direct bank
                        transfer.
                      </li>
                    )}
                    <li>Your receipt is emailed to you once the payment is confirmed.</li>
                  </ul>
                </details>

                <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-[#703BF7]"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    required
                  />
                  <span>
                    I agree with the{" "}
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[#703BF7] underline underline-offset-2 hover:text-[#9677df] dark:text-[#b79bff]"
                    >
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy-policy"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[#703BF7] underline underline-offset-2 hover:text-[#9677df] dark:text-[#b79bff]"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
                  {isSubmitting
                    ? "Processing..."
                    : byBankTransfer
                      ? "Get bank transfer details"
                      : `Pay ₦${price.toLocaleString()}`}
                </button>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PropertyPaymentModal;