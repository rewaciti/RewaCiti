import React, { useState } from "react";
import { useAuthStore } from "../../auth/store/useAuthStore";
import * as Dialog from "@radix-ui/react-dialog";
import type { Property } from "../../../types";
import type { VisitMode, VisitSlot } from "../../../types/realEstate";
import { FiX, FiMapPin } from "react-icons/fi";
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
  const feeDisplay = amount === 0 ? "inspection is free" : `₦${amount.toLocaleString()}`;
  const confirmedByTeam = visitRules?.confirmation === "by_team";

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

          <p id="inspection-modal-description" className="sr-only">Book a property inspection and pay securely. All details are required for processing.</p>
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
              {modes.length > 1 && (
                <div>
                  <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">How would you like to visit?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {modes.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setMode(option)}
                        aria-pressed={mode === option}
                        className={`rounded-md border px-2 py-1.5 text-sm transition-colors ${mode === option
                          ? "border-[#703BF7] bg-[#703BF7] text-white"
                          : "border-gray-600/30 bg-white/80 text-gray-900 hover:border-[#703BF7] dark:bg-[#1A1A1A] dark:text-white"
                          }`}
                      >
                        {MODE_LABELS[option]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Preferred Date</label>
                  <input
                    type="date"
                    required
                    min={minVisitDate}
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full rounded-md border border-gray-600/30 bg-white/80 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-[#703BF7] dark:bg-[#1A1A1A] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Preferred Time</label>
                  <select
                    required
                    disabled={!visitDate || slotsLoading || freeSlots.length === 0}
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full rounded-md border border-gray-600/30 bg-white/80 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-[#703BF7] disabled:opacity-60 dark:bg-[#1A1A1A] dark:text-white"
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
                </div>
              </div>
              <p className="text-xs dark:text-gray-400 leading-snug text-gray-500">
                {visitDate && !slotsLoading && freeSlots.length === 0
                  ? "There are no visit times left on this day. Please try another day."
                  : `Only times that are still free are shown${minNoticeHours > 0 ? `, and visits need at least ${minNoticeHours} hours' notice` : ""}.${confirmedByTeam ? " Your visit is confirmed once our team checks the agent is available." : ""}`}
              </p>
           </div>

           <div className="p-2 bg-gray-500/10 border border-gray-600/30 rounded-lg">
              <p className="text-sm dark:text-gray-300 text-gray-700 text-center">
                A member of our team will contact you within{" "}
                <span className="font-semibold text-[#703BF7]">24 hours</span> to confirm your property details and the viewing.
              </p>
            </div>

            <div className="p-2 bg-[#703BF7]/10 rounded-lg border border-[#703BF7]/30 space-y-2">
              <div className="border-b border-[#703BF7]/20 pb-2 mb-2">
                <h4 className="font-semibold dark:text-white text-gray-900">{property.name}</h4>
                <p className="text-xs dark:text-gray-400 text-gray-600">
                  {property.category}
                  {property.bedrooms > 0 && ` • ${property.bedrooms} Bedrooms`}
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm dark:text-gray-300 text-gray-700">
                <FiMapPin className="text-[#703BF7] mt-1 shrink-0" />
                <span>{addressOf(property)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#703BF7]/20 pt-2">
                <span className="text-sm font-medium dark:text-white text-gray-900">Visitation Fee</span>
                <span className="text-lg font-bold text-[#703BF7]">
                  {feeDisplay}
                </span>
              </div>
              <div className="text-xs text-[#703BF7] dark:text-[#a78bfa] leading-snug">
                <p>
                  The visitation fee covers the agent&apos;s time only,
                  transportation is not included.
                  {(visitRules?.serviceCharge ?? 0) > 0 &&
                    ` It includes a ₦${visitRules?.serviceCharge.toLocaleString()} service charge that isn't refundable.`}{" "}
                  See the{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-semibold"
                  >
                    Terms &amp; Conditions
                  </Link>{" "}
                  for the full visitation rules.
                </p>
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
              disabled={isSubmitting || !fullName.trim() || !bookingEmail.trim() || !phone.trim() || !visitDate || !visitTime || !agreed}
              className={`w-full font-medium py-3 rounded-md transition-colors mt-4 disabled:opacity-50 ${isSubmitting || !fullName.trim() || !bookingEmail.trim() || !phone.trim() || !visitDate || !visitTime || !agreed
                ? "bg-gray-400 cursor-not-allowed text-gray-200"
                : "bg-[#703BF7] hover:bg-[#5c2fe0] text-white cursor-pointer"
                }`}
            >
              {isSubmitting ? "Processing..." : amount > 0 ? "Pay & Book a Visit" : "Book a Visit"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BookInspectionModal;
