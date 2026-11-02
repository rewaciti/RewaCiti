import React, { useState } from "react";
import { useAuthStore } from "../../auth/store/useAuthStore";
import * as Dialog from "@radix-ui/react-dialog";
import type { Property } from "../../../types";
import type { VisitMode, VisitSlot } from "../../../types/realEstate";
import { FiX, FiMapPin, FiChevronDown } from "react-icons/fi";
import { toast } from "sonner";
import { authAPI } from "../../auth/services/authAPI";
import { getCookie, setCookie } from "../../../shared/lib/utils";
import { errorMessage, noteTestMode } from "../../../shared/lib/realEstateApi";
import { payInvoice } from "../../../shared/lib/payments";
import useRequestKey from "../../../shared/hooks/useRequestKey";
import { usePropertyStore } from "../../properties/store/usePropertyStore";
import { addressOf } from "../../properties/services/toProperty";
import { visitsAPI } from "../services/visitsAPI";
import { Link } from "react-router";

// Same serif as the Navbar (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#703BF7] focus:ring-2 focus:ring-[#703BF7]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#101010] dark:text-white";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-900 dark:text-white";
const boxClass = "rounded-2xl bg-gray-100 p-4 dark:bg-white/5";
const mutedClass = "text-gray-600 dark:text-gray-400";
const primaryButtonClass =
  "w-full cursor-pointer rounded-full bg-[#703BF7] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#9677df] disabled:cursor-not-allowed disabled:opacity-50";

interface BookInspectionModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MODE_LABELS: Record<VisitMode, string> = {
  in_person: "In person",
  virtual: "Video call",
};

const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatTwelveHourTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
};

const formatVisit = (date: string, time: string) => {
  const day = new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T00:00:00`));
  return `${day} at ${formatTwelveHourTime(time)}`;
};

const BookInspectionModal: React.FC<BookInspectionModalProps> = ({
  property,
  open,
  onOpenChange,
}) => {
  const { isAuthenticated, customer } = useAuthStore();
  const visitRules = usePropertyStore((state) => state.forms?.visit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePhone, setProfilePhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [mode, setMode] = useState<VisitMode>("in_person");
  const [slots, setSlots] = useState<VisitSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const modalCookieKey = "rewaciti_inspection_modal";

  // Paying again after closing the popup reuses the same held time, until the hold runs out
  const requestKey = useRequestKey();
  const [heldUntil, setHeldUntil] = useState(0);

  const phone = profilePhone || customer?.phoneNumber || guestPhone;
  const minNoticeHours = visitRules?.minNoticeHours ?? 0;
  const modes = visitRules?.modes ?? ["in_person"];
  const minVisitDate = formatLocalDate(new Date(Date.now() + minNoticeHours * 60 * 60 * 1000));
  const freeSlots = slots.filter((slot) => slot.available);

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
    }));
  }, [guestName, guestEmail, guestPhone, agreed]);

  // The free times on the chosen day: notice, visiting hours and booked times are already applied
  React.useEffect(() => {
    if (!open || !visitDate) {
      setSlots([]);
      return;
    }

    let current = true;
    setSlotsLoading(true);
    setVisitTime("");
    visitsAPI
      .slots(property.id, visitDate)
      .then((result) => current && setSlots(result))
      .catch((error) => {
        console.error("Failed to load visit times:", error);
        if (current) setSlots([]);
      })
      .finally(() => current && setSlotsLoading(false));

    return () => {
      current = false;
    };
  }, [open, visitDate, property.id]);

  const amount = property.visitationfee;
  const feeDisplay = amount === null ? "Loading..." : amount === 0 ? "Free" : `₦${amount.toLocaleString()}`;
  const confirmedByTeam = visitRules?.confirmation === "team_confirms";

  const fullName = customer ? `${customer.firstName} ${customer.lastName}`.trim() : guestName;
  const bookingEmail = customer?.email ?? guestEmail;

  const done = (message: string) => {
    toast.success(<div className="whitespace-pre-wrap">{message}</div>, { duration: 6000 });
    requestKey.renew();
    setHeldUntil(0);
    setVisitDate("");
    setVisitTime("");
    onOpenChange(false);
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

    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy to continue.");
      return;
    }

    setIsSubmitting(true);
    if (heldUntil && Date.now() > heldUntil) requestKey.renew();
    const when = formatVisit(visitDate, visitTime);
    const confirmation = confirmedByTeam
      ? `We'll confirm your visit on ${when} once the agent is available.`
      : `Your visit is booked for ${when}.`;

    try {
      // 1. Book the time. It's held while the fee is paid.
      const reply = await visitsAPI.book(
        {
          propertyId: property.id,
          name: fullName.trim(),
          email: bookingEmail.trim(),
          phone: phone.trim(),
          date: visitDate,
          start: visitTime,
          mode,
          consent: agreed,
        },
        requestKey.current(),
      );
      noteTestMode(reply);
      if (reply.test) return;

      const booking = reply.data;
      if (booking.holdExpiresAt) setHeldUntil(new Date(booking.holdExpiresAt).getTime());

      if (booking.status !== "pending_payment" || !booking.invoiceId) {
        done(`${confirmation}\nThe details are on their way to ${bookingEmail.trim()}.`);
        return;
      }

      // 2. Pay the fee in the Paystack popup, or on the visit's own page
      const outcome = await payInvoice({ invoiceId: booking.invoiceId, email: bookingEmail.trim(), paymentLink: booking.paymentLink });

      if (outcome === "paid") {
        done(`Payment successful!\n${confirmation} Your receipt is on its way to ${bookingEmail.trim()}.`);
      } else if (outcome === "pending") {
        done(`We've received your payment.\nYour visit on ${when} will be confirmed once Paystack confirms it.`);
      } else if (outcome === "cancelled") {
        toast.info("Payment cancelled. Your time is held for a short while if you'd like to try again.");
      } else if (outcome === "failed") {
        toast.error("The payment didn't go through. Please try again.");
      }
    } catch (error) {
      console.error("Payment flow error:", error);
      toast.error(errorMessage(error, "An error occurred during the payment process."), { duration: 6000 });
      // A time that was just taken is gone from the list
      if (visitDate) visitsAPI.slots(property.id, visitDate).then(setSlots).catch(() => undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !isSubmitting &&
    !!fullName.trim() &&
    !!bookingEmail.trim() &&
    !!phone.trim() &&
    !!visitDate &&
    !!visitTime &&
    agreed;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm dialog-overlay-animate" />
        <Dialog.Content
          className="property-dialog-content responsive-sheet-animate fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-t-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl outline-none dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
          aria-describedby="inspection-modal-description"
        >
          {/* Header pinned flush to the top; padding lives on the outer wrapper */}
          <div className="sticky top-0 z-20 border-b border-gray-200 bg-white px-5 py-5 dark:border-white/10 dark:bg-[#1A1A1A] sm:px-6">
            <div className="property-dialog-header flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Dialog.Title style={SERIF} className="text-2xl font-semibold">
                  Book a visit
                </Dialog.Title>
                <p className={`property-dialog-subtitle mt-1 truncate ${mutedClass}`}>
                  {property.name}
                </p>
              </div>
              <Dialog.Description className="sr-only">
                Schedule a visit to {property.name} and pay the inspection fee securely.
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

          <p id="inspection-modal-description" className="sr-only">
            Book a property inspection and pay securely. All details are required for processing.
          </p>

          <div className="px-5 pb-6 pt-5 sm:px-6">
            <form onSubmit={handleSubmit} className="visit-form space-y-5">
              {/* Who is booking */}
              {isAuthenticated && customer ? (
                <div className={boxClass}>
                  <p className={`mb-2 text-xs ${mutedClass}`}>Booking as</p>
                  <p className="text-sm font-semibold">{fullName}</p>
                  <p className="break-all text-sm text-gray-700 dark:text-gray-300">{bookingEmail}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {phone || (
                      <span className="italic text-red-500">No phone number in your profile</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor="visit-name">
                      Full name <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="visit-name"
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="visit-email">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="visit-email"
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="visit-phone">
                      Phone number <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="visit-phone"
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

              {/* When */}
              <div className="space-y-4">
                {modes.length > 1 && (
                  <div>
                    <span className={labelClass}>How would you like to visit?</span>
                    <div className="grid grid-cols-2 gap-2">
                      {modes.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setMode(option)}
                          aria-pressed={mode === option}
                          className={`visit-mode-option cursor-pointer rounded-full border px-3 py-2.5 text-sm font-semibold transition ${
                            mode === option
                              ? "border-[#703BF7] bg-[#703BF7] text-white"
                              : "border-gray-300 bg-white text-gray-900 hover:border-[#703BF7] hover:text-[#703BF7] dark:border-white/15 dark:bg-[#101010] dark:text-white"
                          }`}
                        >
                          {MODE_LABELS[option]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="visit-date">
                      Preferred date <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="visit-date"
                      type="date"
                      required
                      min={minVisitDate}
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="visit-time">
                      Preferred time <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="visit-time"
                        required
                        disabled={!visitDate || slotsLoading || freeSlots.length === 0}
                        value={visitTime}
                        onChange={(e) => setVisitTime(e.target.value)}
                        className={`${inputClass} cursor-pointer appearance-none pr-10`}
                      >
                        <option value="" disabled>
                          {!visitDate
                            ? "Pick a date first"
                            : slotsLoading
                              ? "Loading times..."
                              : freeSlots.length === 0
                                ? "No times this day"
                                : "Select time"}
                        </option>
                        {freeSlots.map((slot) => (
                          <option key={slot.start} value={slot.start}>
                            {formatTwelveHourTime(slot.start)}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown
                        size={18}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                <p className={`text-xs leading-5 ${mutedClass}`}>
                  {visitDate && !slotsLoading && freeSlots.length === 0
                    ? "There are no visit times left on this day. Please try another day."
                    : `Only times that are still free are shown${minNoticeHours > 0 ? `, and visits need at least ${minNoticeHours} hours' notice` : ""}.${confirmedByTeam ? " Your visit is confirmed once our team checks the agent is available." : ""}`}
                </p>
              </div>

              {/* Property + fee */}
              <div className={boxClass}>
                <h4 style={SERIF} className="text-lg font-semibold">
                  {property.name}
                </h4>
                <p className={`mt-0.5 text-sm ${mutedClass}`}>
                  {property.category}
                  {property.bedrooms > 0 && ` · ${property.bedrooms} bedrooms`}
                </p>
                <div className="mt-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <FiMapPin className="mt-0.5 shrink-0 text-[#703BF7] dark:text-[#b79bff]" />
                  <span>{addressOf(property)}</span>
                </div>

                <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-gray-300 pt-4 dark:border-white/10">
                  <span className="font-semibold">Visitation fee</span>
                  <span className="text-lg font-semibold">{feeDisplay}</span>
                </div>

                <p className={`mt-3 text-xs leading-5 ${mutedClass}`}>
                  The visitation fee covers the agent&apos;s time only, transportation is not
                  included.
                  {(visitRules?.serviceCharge ?? 0) > 0 &&
                    ` It includes a ₦${visitRules?.serviceCharge.toLocaleString()} service charge that isn't refundable.`}{" "}
                  See the{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#703BF7] underline underline-offset-2 dark:text-[#b79bff]"
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  for the full visitation rules.
                </p>
              </div>

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
                  : amount === 0
                    ? "Book a visit"
                    : "Pay & book a visit"}
              </button>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BookInspectionModal;