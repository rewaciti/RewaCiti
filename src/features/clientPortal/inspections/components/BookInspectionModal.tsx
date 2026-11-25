import { useEffect, useMemo, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bath, BedDouble, CalendarDays, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { authAPI } from "../../auth/services/authAPI";
import { getCookie, setCookie } from "@/shared/lib/utils";
import { errorMessage, noteTestMode } from "@/shared/lib/realEstateApi";
import { payInvoice } from "@/shared/lib/payments";
import useRequestKey from "@/shared/hooks/useRequestKey";
import { usePropertyStore } from "@/shared/store/usePropertyStore";
import { addressOf } from "@/shared/domain/property/toProperty";
import { visitsAPI } from "@/shared/api/visitsAPI";
import type { Property } from "@/types";
import type { VisitMode, VisitSlot } from "@/types/realEstate";

interface BookInspectionModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const money = (amount: number) =>
  `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(amount)}`;

const periodShortLabel = (period: string) => {
  if (period === "per_year") return "/yr";
  if (period === "per_month") return "/mo";
  if (period === "per_night") return "/night";
  return "";
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
};

const formatVisit = (date: string, time: string) => {
  const day = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T00:00:00`));
  return `${day} at ${formatTime(time)}`;
};

const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const monthLabel = (date: Date) => new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(date);

const inputClass = "min-h-11 w-full rounded-[5px] border border-gray-300 bg-white px-3 text-[13px] text-gray-900 outline-none placeholder:text-gray-500 focus:border-[#b79bff] focus:ring-[3px] focus:ring-[#b79bff]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white";
const labelClass = "grid min-w-0 gap-1.5 text-[13px] font-medium";
const linkClass = "font-semibold text-[#b79bff] underline underline-offset-2 dark:text-[#b79bff]";

const BookInspectionModal = ({ property, open, onOpenChange }: BookInspectionModalProps) => {
  const { customer, isAuthenticated } = useAuthStore();
  const visitRules = usePropertyStore((state) => state.forms?.visit);
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
  const [submitting, setSubmitting] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => monthStart(new Date()));
  const [heldUntil, setHeldUntil] = useState(0);
  const requestKey = useRequestKey();

  const minVisitDate = toLocalDate(new Date());
  const minMonth = monthStart(new Date(`${minVisitDate}T00:00:00`));
  const maxMonth = new Date(minMonth.getFullYear(), minMonth.getMonth() + 3, 1);
  const freeSlots = slots.filter((slot) => slot.available && slot.placesLeft > 0);
  const amount = property.visitationfee;
  const feeLabel = amount === null ? "Loading…" : amount === 0 ? "Free" : `₦${amount.toLocaleString()}`;
  const totalAmount = `${money(property.pricing.total)}${periodShortLabel(property.pricePeriod)}`;
  const baseAmount = `${money(property.pricing.base)}${periodShortLabel(property.pricePeriod)}`;
  const fullName = customer ? `${customer.firstName} ${customer.lastName}`.trim() : guestName.trim();
  const bookingEmail = (customer?.email ?? guestEmail).trim();
  const phone = (profilePhone || customer?.phoneNumber || guestPhone).trim();
  const readOnlyContact = isAuthenticated && !!customer;
  const serviceCharge = visitRules?.serviceCharge ?? 0;

  useEffect(() => {
    const savedForm = getCookie("rewaciti_inspection_modal");
    if (!savedForm) return;
    try {
      const parsed = JSON.parse(savedForm) as { guestName?: string; guestEmail?: string; guestPhone?: string; agreed?: boolean };
      setGuestName(parsed.guestName || "");
      setGuestEmail(parsed.guestEmail || "");
      setGuestPhone(parsed.guestPhone || "");
      setAgreed(Boolean(parsed.agreed));
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) return;
    setCookie("rewaciti_inspection_modal", JSON.stringify({ guestName, guestEmail, guestPhone, agreed }));
  }, [agreed, guestEmail, guestName, guestPhone, isAuthenticated]);

  useEffect(() => {
    if (!open || !isAuthenticated) return;
    let active = true;
    void authAPI.getProfile()
      .then((profileData) => {
        if (!active) return;
        const latestPhone = profileData.phoneNumber || "";
        setProfilePhone(latestPhone);
        const currentCustomer = useAuthStore.getState().customer;
        if (currentCustomer && currentCustomer.phoneNumber !== latestPhone) {
          useAuthStore.getState().setCustomer({ ...currentCustomer, phoneNumber: latestPhone });
        }
      })
      .catch((error: unknown) => console.error("Failed to fetch profile in book visit modal:", error));
    return () => {
      active = false;
    };
  }, [isAuthenticated, open]);

  useEffect(() => {
    if (open && !visitDate) {
      setVisitDate(minVisitDate);
      setCalendarMonth(monthStart(new Date(`${minVisitDate}T00:00:00`)));
    }
  }, [minVisitDate, open, visitDate]);

  useEffect(() => {
    if (!open || !visitDate) {
      setSlots([]);
      return;
    }

    let active = true;
    setSlotsLoading(true);
    setVisitTime("");
    void visitsAPI.slots(property.id, visitDate)
      .then((result) => {
        if (active) setSlots(result);
      })
      .catch((error: unknown) => {
        console.error("Failed to load visit times:", error);
        if (active) {
          setSlots([]);
          toast.error(errorMessage(error, "We couldn't load available visit times."));
        }
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, property.id, visitDate]);

  const calendarDays = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const offset = first.getDay();
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
    return Array.from({ length: cellCount }, (_, index) => {
      const dayNumber = index - offset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) return null;
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayNumber);
      const value = toLocalDate(date);
      return { dayNumber, value, disabled: value < minVisitDate };
    });
  }, [calendarMonth, minVisitDate]);

  const done = (message: string) => {
    toast.success(<div className="whitespace-pre-wrap">{message}</div>, { duration: 6000 });
    requestKey.renew();
    setHeldUntil(0);
    setVisitDate("");
    setVisitTime("");
    setAgreed(false);
    onOpenChange(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fullName || !bookingEmail || !phone) {
      toast.error(isAuthenticated
        ? "Add a phone number to your profile to book the visit."
        : "Please enter your name, email, and phone number to continue.");
      return;
    }
    if (!visitDate || !visitTime) {
      toast.error("Please select a visit date and time.");
      return;
    }
    if (!freeSlots.some((slot) => slot.start === visitTime)) {
      toast.error("Choose an available time.");
      return;
    }
    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy to continue.");
      return;
    }

    if (heldUntil && Date.now() > heldUntil) requestKey.renew();
    setSubmitting(true);
    const when = formatVisit(visitDate, visitTime);
    const confirmation = visitRules?.confirmation === "team_confirms"
      ? `We'll confirm your visit on ${when} once the agent is available.`
      : `Your visit is booked for ${when}.`;

    try {
      const reply = await visitsAPI.book({
        propertyId: property.id,
        name: fullName,
        email: bookingEmail,
        phone,
        date: visitDate,
        start: visitTime,
        mode,
        consent: agreed,
      }, requestKey.current());
      noteTestMode(reply);
      if (reply.test) return;

      const booking = reply.data;
      if (booking.holdExpiresAt) setHeldUntil(new Date(booking.holdExpiresAt).getTime());

      if (booking.status !== "pending_payment" || !booking.invoiceId) {
        done(`${confirmation}\nThe details are on their way to ${bookingEmail}.`);
        return;
      }

      const outcome = await payInvoice({
        invoiceId: booking.invoiceId,
        email: bookingEmail,
        paymentLink: booking.paymentLink,
      });
      if (outcome === "paid") {
        done(`Payment successful!\n${confirmation} Your receipt is on its way to ${bookingEmail}.`);
      } else if (outcome === "pending") {
        done(`We've received your payment.\nYour visit on ${when} will be confirmed once Paystack confirms it.`);
      } else if (outcome === "cancelled") {
        toast.info("Payment cancelled. Your time is held for a short while if you'd like to try again.");
      } else if (outcome === "failed") {
        toast.error("The payment didn't go through. Please try again.");
      }
    } catch (error) {
      console.error("Client book-visit payment flow failed:", error);
      toast.error(errorMessage(error, "An error occurred during the payment process."), { duration: 6000 });
      if (visitDate) {
        void visitsAPI.slots(property.id, visitDate)
          .then(setSlots)
          .catch((slotsError: unknown) => console.error("Client book-visit times refresh failed:", slotsError));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !submitting && amount !== null && !!fullName && !!bookingEmail && !!phone &&
    !!visitDate && !!visitTime && freeSlots.some((slot) => slot.start === visitTime) && agreed;
  const selectedDateHeading = visitDate
    ? new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long" })
      .format(new Date(`${visitDate}T00:00:00`))
    : "Choose a date";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Content className="fixed top-1/2 left-1/2 z-71 flex max-h-[min(90dvh,900px)] w-[min(820px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl outline-none dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white max-[700px]:top-auto max-[700px]:bottom-0 max-[700px]:left-0 max-[700px]:w-full max-[700px]:max-h-[92dvh] max-[700px]:translate-x-0 max-[700px]:translate-y-0 max-[700px]:rounded-t-3xl max-[700px]:rounded-b-none max-[700px]:border-b-0" aria-describedby="client-book-modal-description">
          <header className="relative z-1 flex flex-[0_0_auto] items-start justify-between gap-3 border-b border-gray-200 bg-white px-[26px] py-[21px] dark:border-white/10 dark:bg-[#1A1A1A] max-[700px]:gap-2 max-[700px]:px-[18px] max-[700px]:py-[17px]">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="m-0 font-serif text-[25px] font-semibold max-[700px]:text-[22px]">Book a visit</Dialog.Title>
              <p className="mt-1 mb-0 text-[13px] text-gray-500 dark:text-gray-400 max-[700px]:text-xs max-[700px]:leading-[1.4]">Choose a time, add your details and pay the visit fee securely.</p>
            </div>
            <Dialog.Description id="client-book-modal-description" className="sr-only">
              Choose a date and time, provide your contact details, and book a visit to {property.name}.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button type="button" className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full text-inherit hover:bg-gray-100 dark:hover:bg-white/8" aria-label="Close booking">
                <X size={20} />
              </button>
            </Dialog.Close>
          </header>

          <form onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-1 flex-col">
            <div className="grid min-h-0 gap-5 overflow-y-auto px-[26px] py-5 max-[700px]:gap-[17px] max-[700px]:px-[18px] max-[700px]:py-4">
              <section className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-gray-100 p-3 dark:border-white/15 dark:bg-[#202020] max-[700px]:gap-y-2.5">
                {property.img ? <img className="h-[68px] w-[82px] shrink-0 overflow-hidden rounded-[11px] bg-gray-200 object-cover dark:bg-[#303030] max-[700px]:h-[60px] max-[700px]:w-[70px]" src={property.img} alt="" /> : <div className="grid h-[68px] w-[82px] shrink-0 place-items-center overflow-hidden rounded-[11px] bg-gray-200 dark:bg-[#303030] max-[700px]:h-[60px] max-[700px]:w-[70px]"><CalendarDays size={22} /></div>}
                <div className="grid min-w-0 flex-1 gap-1">
                  <strong className="truncate text-[15px]">{property.name}</strong>
                  <span className="flex items-center gap-[5px] text-xs text-gray-500 dark:text-gray-400"><MapPin size={14} /> {addressOf(property)}</span>
                  <div className="flex flex-wrap items-center gap-[7px]">
                    <span className="inline-flex items-center gap-[3px] text-[11px] text-gray-500">{property.category} · {property.listingType}</span>
                    {property.bedrooms > 0 && <span className="inline-flex items-center gap-[3px] text-[11px] text-gray-500"><BedDouble size={14} /> {property.bedrooms} bed</span>}
                    {property.bathrooms > 0 && <span className="inline-flex items-center gap-[3px] text-[11px] text-gray-500"><Bath size={14} /> {property.bathrooms} bath</span>}
                  </div>
                </div>
                <div className="ml-auto grid shrink-0 justify-items-end gap-0.5 max-[700px]:ml-0 max-[700px]:w-full max-[700px]:justify-items-start max-[700px]:border-t max-[700px]:border-gray-200 max-[700px]:pt-2 dark:max-[700px]:border-white/10">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Total amount</span>
                  <strong className="whitespace-nowrap text-[15px]">{totalAmount}</strong>
                  {property.pricing.total !== property.pricing.base && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Property cost {baseAmount}</span>
                  )}
                </div>
              </section>

              <section className="flex min-h-16 items-center justify-between gap-4 rounded-md border border-gray-200 px-[13px] py-[11px] dark:border-white/15">
                <div className="grid gap-[3px]">
                  <strong className="text-[13px] font-medium">Visit type</strong>
                  <span className="text-[11px] text-gray-500 dark:text-neutral-400">In person or a video call with the agent.</span>
                </div>
                <div className="flex shrink-0 gap-1 rounded-full bg-gray-100 p-1 dark:bg-[#101010]">
                  <button
                    type="button"
                    aria-pressed={mode === "in_person"}
                    onClick={() => setMode("in_person")}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${mode === "in_person" ? "bg-[#b79bff] text-white" : "text-gray-600 hover:bg-white dark:text-gray-400 dark:hover:bg-white/5"}`}
                  >In person</button>
                  <button
                    type="button"
                    aria-pressed={mode === "virtual"}
                    onClick={() => setMode("virtual")}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${mode === "virtual" ? "bg-[#b79bff] text-white" : "text-gray-600 hover:bg-white dark:text-gray-400 dark:hover:bg-white/5"}`}
                  >Video call</button>
                </div>
              </section>

              <div className="grid grid-cols-[minmax(270px,0.78fr)_minmax(0,1.22fr)] items-start gap-4 max-[700px]:grid-cols-1">
                <section className="rounded-[5px] border border-gray-200 p-3 dark:border-white/15">
                  <div className="mb-2.5 flex items-center justify-center gap-[9px]">
                    <strong className="text-[13px] font-medium">{monthLabel(calendarMonth)}</strong>
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        aria-label="Previous month"
                        disabled={calendarMonth <= minMonth}
                        onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                        className="grid h-[29px] w-[29px] place-items-center rounded border border-gray-200 bg-white dark:border-white/10 dark:bg-[#101010] disabled:cursor-not-allowed disabled:opacity-40"
                      ><ChevronLeft size={17} /></button>
                      <button
                        type="button"
                        aria-label="Next month"
                        disabled={calendarMonth >= maxMonth}
                        onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                        className="grid h-[29px] w-[29px] place-items-center rounded border border-gray-200 bg-white dark:border-white/10 dark:bg-[#101010] disabled:cursor-not-allowed disabled:opacity-40"
                      ><ChevronRight size={17} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-px">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span className="grid min-h-9 place-items-center text-[11px] font-normal text-gray-500 dark:text-gray-400" key={day}>{day}</span>)}
                    {calendarDays.map((day, index) => day ? (
                      <button
                        type="button"
                        key={day.value}
                        className={`grid min-h-9 place-items-center rounded-[3px] text-[13px] hover:bg-gray-100 dark:hover:bg-white/8 disabled:cursor-not-allowed disabled:text-gray-300 dark:disabled:text-neutral-600 ${visitDate === day.value ? "bg-[#b79bff] text-white hover:bg-[#b79bff]" : "bg-transparent text-inherit"}`}
                        disabled={day.disabled}
                        aria-pressed={visitDate === day.value}
                        onClick={() => {
                          setVisitDate(day.value);
                          setVisitTime("");
                        }}
                      >{day.dayNumber}</button>
                    ) : <span className="grid min-h-9 place-items-center" key={`blank-${index}`} />)}
                  </div>
                </section>

                <section className="grid gap-[9px] pt-0.5">
                  <h3 className="m-0 text-sm font-medium">{selectedDateHeading}</h3>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-gray-500 dark:text-gray-400" role="status">
                      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-200 border-t-[#b79bff] dark:border-white/10 dark:border-t-[#b79bff]" aria-hidden="true" />
                      <span>Loading visit times…</span>
                    </div>
                  ) : freeSlots.length ? (
                    <div className="grid grid-cols-4 gap-2 max-[430px]:grid-cols-3">
                      {freeSlots.map((slot) => (
                        <button
                          type="button"
                          key={slot.start}
                          className={`grid min-h-[50px] min-w-0 content-center justify-items-center gap-0.5 rounded-[5px] border px-[7px] py-[5px] text-[13px] hover:border-[#b79bff] ${visitTime === slot.start ? "border-[#b79bff] bg-[#b79bff] text-white" : "border-gray-300 bg-white text-gray-900 dark:border-white/15 dark:bg-[#202020] dark:text-white"}`}
                          aria-pressed={visitTime === slot.start}
                          onClick={() => setVisitTime(slot.start)}
                        >
                          <span>{formatTime(slot.start)}</span>
                          <small className={visitTime === slot.start ? "text-[10px] text-white/80" : "text-[10px] text-gray-500"}>{slot.placesLeft} left</small>
                        </button>
                      ))}
                    </div>
                  ) : <p className="m-0 text-xs text-gray-500">No available times. Try another date.</p>}
                </section>
              </div>

              <section className="grid gap-4 rounded-lg border border-gray-200 bg-gray-100 p-3.5 dark:border-white/15 dark:bg-[#202020]">
                {readOnlyContact ? (
                  <div className="grid gap-3">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Booking as</span>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="grid gap-0.5 rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[#161616]">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">Name</span>
                        <strong className="wrap-anywhere text-sm text-[#111827] dark:text-white">{fullName}</strong>
                      </div>
                      <div className="grid gap-0.5 rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[#161616]">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">Email</span>
                        <strong className="wrap-anywhere text-xs font-medium text-[#111827] dark:text-white">{bookingEmail}</strong>
                      </div>
                      <div className="grid gap-0.5 rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[#161616]">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">Number</span>
                        <strong className={`wrap-anywhere text-xs font-medium ${phone ? "text-[#111827] dark:text-white" : "text-red-500"}`}>{phone || "No phone number in your profile"}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 max-[430px]:grid-cols-1">
                    <label className={labelClass}>Your name *<input required value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Full name" autoComplete="name" className={inputClass} /></label>
                    <label className={labelClass}>Email<input required type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} placeholder="Email address" autoComplete="email" className={inputClass} /></label>
                    <label className={`${labelClass} col-span-2 max-[430px]:col-span-1`}>Phone<input required type="tel" value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} placeholder="+234..." autoComplete="tel" className={inputClass} /></label>
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-gray-200 p-3.5 text-xs leading-relaxed text-gray-600 dark:border-white/15 dark:text-gray-400">
                <p className="m-0">
                  This booking is for the agent&apos;s time, not the property itself. It does not reserve, hold, or buy the property. No visitor count is needed. The fee covers the agent&apos;s time only; transportation is not included.
                  {serviceCharge > 0 && ` It includes a ₦${serviceCharge.toLocaleString()} service charge that isn't refundable.`}
                  {" "}See the{" "}
                  <Link to="/terms" target="_blank" rel="noreferrer" className={linkClass}>Terms &amp; Conditions</Link>
                  {" "}for the full rules. You can reschedule from your account before the agreed time.
                </p>
              </section>

              <label className="flex items-start gap-2.5 text-xs leading-normal text-gray-500 [&_a]:font-semibold [&_a]:text-[#b79bff] [&_a]:underline dark:text-gray-400 dark:[&_a]:text-[#b79bff]">
                <input className="mt-0.5 h-[22px] w-[22px] shrink-0 accent-[#b79bff]" type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} required />
                <span>
                  I agree with the{" "}
                  <Link to="/terms" target="_blank" rel="noreferrer" className={linkClass}>Terms</Link>
                  {" "}and{" "}
                  <Link to="/privacy-policy" target="_blank" rel="noreferrer" className={linkClass}>Privacy Policy</Link>
                  .
                </span>
              </label>
            </div>

            <footer className="flex min-h-16 flex-[0_0_auto] items-center justify-between gap-4 border-t border-gray-200 bg-white px-[26px] py-3.5 dark:border-white/15 dark:bg-[#1A1A1A] max-[700px]:px-[18px] max-[700px]:py-3 max-[700px]:pb-[calc(12px+env(safe-area-inset-bottom))] max-[430px]:grid max-[430px]:grid-cols-1 max-[430px]:gap-2">
              <div className="flex items-baseline gap-[5px]"><span className="text-[13px] text-gray-500">Visit fee:</span><strong className="text-sm">{feeLabel}</strong></div>
              <div className="flex items-center gap-[9px] max-[700px]:gap-[7px] max-[430px]:grid max-[430px]:grid-cols-[auto_minmax(0,1fr)]">
                <button type="button" className="min-h-[43px] rounded-[5px] border border-gray-300 bg-white px-[17px] text-[13px] font-medium text-gray-900 dark:border-white/15 dark:bg-[#202020] dark:text-white max-[430px]:w-full max-[430px]:min-w-0 max-[430px]:px-[15px] max-[430px]:text-xs" onClick={() => onOpenChange(false)}>Cancel</button>
                <button type="submit" className="min-h-[43px] rounded-[5px] border border-[#b79bff] bg-[#b79bff] px-[17px] text-[13px] font-semibold text-white hover:bg-[#b79bff] disabled:cursor-not-allowed disabled:opacity-50 max-[430px]:w-full max-[430px]:min-w-0 max-[430px]:px-[15px] max-[430px]:text-xs" disabled={!canSubmit}>
                  {submitting ? "Booking…" : "Book visit"}
                </button>
              </div>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BookInspectionModal;
