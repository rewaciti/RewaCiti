import { useEffect, useMemo, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bath, BedDouble, CalendarDays, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { errorMessage, noteTestMode } from "@/shared/lib/realEstateApi";
import useRequestKey from "@/shared/hooks/useRequestKey";
import type { Property } from "@/types";
import type { VisitMode, VisitSlot } from "@/types/realEstate";
import { usePropertyStore } from "@/shared/store/usePropertyStore";
import { addressOf } from "@/shared/domain/property/toProperty";
import { visitsAPI } from "@/shared/api/visitsAPI";
import { money, periodShortLabel } from "@/features/agentPortal/common/utils/agentListingUtils";

interface AgentBookInspectionModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBooked?: () => void;
}

const DEFAULT_MODES: VisitMode[] = ["in_person"];

const toLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

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

const AgentBookInspectionModal = ({ property, open, onOpenChange, onBooked }: AgentBookInspectionModalProps) => {
  const { customer } = useAuthStore();
  const visitRules = usePropertyStore((state) => state.forms?.visit);
  const consentText = usePropertyStore((state) => state.forms?.consentText);
  const [customerName, setCustomerName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitors, setVisitors] = useState(1);
  const [mode, setMode] = useState<VisitMode>("in_person");
  const [slots, setSlots] = useState<VisitSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => monthStart(new Date()));
  const requestKey = useRequestKey();

  const minNoticeHours = visitRules?.minNoticeHours ?? 0;
  const modes = visitRules?.modes ?? DEFAULT_MODES;
  const minVisitDate = toLocalDate(new Date(Date.now() + minNoticeHours * 60 * 60 * 1000));
  const minMonth = monthStart(new Date(`${minVisitDate}T00:00:00`));
  const maxMonth = new Date(minMonth.getFullYear(), minMonth.getMonth() + 3, 1);
  const freeSlots = slots.filter((slot) => slot.available && slot.placesLeft > 0);
  const selectedSlot = freeSlots.find((slot) => slot.start === visitTime);
  const amount = property.visitationfee;
  const feeLabel = amount === null ? "Loading…" : amount === 0 ? "Free" : `₦${amount.toLocaleString()}`;
  const propertyPrice = `${money(property.pricing.base)}${periodShortLabel(property.pricePeriod)}`;
  const fullName = customerName.trim();
  const bookingEmail = guestEmail.trim();
  const phone = guestPhone.trim();

  useEffect(() => {
    if (!customer) return;
    setCustomerName((value) => value || `${customer.firstName} ${customer.lastName}`.trim());
    setGuestEmail((value) => value || customer.email);
    setGuestPhone((value) => value || customer.phoneNumber || "");
  }, [customer]);

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
        console.error("Agent book-visit times failed to load:", error);
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

  useEffect(() => {
    if (modes.length && !modes.includes(mode)) setMode(modes[0]);
  }, [mode, modes]);

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
    setVisitDate("");
    setVisitTime("");
    setVisitors(1);
    setAgreed(false);
    onBooked?.();
    onOpenChange(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fullName || !bookingEmail || !phone) {
      toast.error("Please enter the customer's name, email, and phone number to continue.");
      return;
    }
    if (!visitDate || !visitTime) {
      toast.error("Please select a visit date and time.");
      return;
    }
    if (!agreed) {
      toast.error("Please confirm the customer has agreed to be contacted.");
      return;
    }
    if (!selectedSlot || visitors < 1 || visitors > selectedSlot.placesLeft) {
      toast.error("Choose an available time with enough spaces for the visitors.");
      return;
    }

    setSubmitting(true);
    const when = formatVisit(visitDate, visitTime);

    try {
      const reply = await visitsAPI.book({
        propertyId: property.id,
        name: fullName,
        email: bookingEmail,
        phone,
        date: visitDate,
        start: visitTime,
        visitors,
        mode,
        consent: agreed,
      }, requestKey.current());
      noteTestMode(reply);
      if (reply.test) return;

      const booking = reply.data;
      const message = booking.status === "pending_payment" && booking.paymentLink
        ? `Visit booked for ${when}. The payment link is ready for ${bookingEmail}.`
        : `Visit booked for ${when}.`;
      done(message);
    } catch (error) {
      console.error("Agent book-visit payment flow failed:", error);
      toast.error(errorMessage(error, "An error occurred during the payment process."), { duration: 6000 });
      if (visitDate) {
        void visitsAPI.slots(property.id, visitDate)
          .then(setSlots)
          .catch((slotsError: unknown) => console.error("Agent book-visit times refresh failed:", slotsError));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !submitting && amount !== null && !!fullName && !!bookingEmail &&
    !!phone && !!visitDate && !!visitTime && visitors >= 1 && !!selectedSlot &&
    visitors <= selectedSlot.placesLeft && agreed;
  const selectedDateHeading = visitDate
    ? new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long" })
      .format(new Date(`${visitDate}T00:00:00`))
    : "Choose a date";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-black/55 backdrop-blur-[3px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-71 flex max-h-[min(90dvh,900px)] w-[min(820px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl outline-none dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white max-[700px]:top-auto max-[700px]:bottom-0 max-[700px]:left-0 max-[700px]:w-full max-[700px]:max-h-[92dvh] max-[700px]:translate-x-0 max-[700px]:translate-y-0 max-[700px]:rounded-t-3xl max-[700px]:rounded-b-none max-[700px]:border-b-0" aria-describedby="agent-book-modal-description">
          <header className="relative z-1 flex flex-[0_0_auto] items-start justify-between gap-4 border-b border-gray-200 bg-white px-[26px] py-[21px] dark:border-white/10 dark:bg-[#1A1A1A] max-[700px]:px-[18px] max-[700px]:py-[17px]">
            <div>
              <Dialog.Title className="m-0 font-serif text-[25px] font-semibold">Book a visit</Dialog.Title>
              <p className="mt-1 mb-0 text-[13px] text-gray-500 dark:text-gray-400">Choose a time, add the visitor&apos;s details and take the visit fee.</p>
            </div>
            <Dialog.Description id="agent-book-modal-description" className="sr-only">
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
              <section className="flex min-w-0 items-center gap-3.5 rounded-2xl border border-gray-200 bg-gray-100 p-3 dark:border-white/15 dark:bg-[#202020]">
                {property.img ? <img className="grid h-[68px] w-[82px] shrink-0 place-items-center overflow-hidden rounded-[11px] bg-gray-200 object-cover dark:bg-[#303030]" src={property.img} alt="" /> : <div className="grid h-[68px] w-[82px] shrink-0 place-items-center overflow-hidden rounded-[11px] bg-gray-200 dark:bg-[#303030]"><CalendarDays size={22} /></div>}
                <div className="grid min-w-0 gap-1">
                  <strong className="truncate text-[15px]">{property.name}</strong>
                  <span className="flex items-center gap-[5px] text-xs text-gray-500 dark:text-gray-400"><MapPin size={14} /> {addressOf(property)}</span>
                  <div className="flex flex-wrap items-center gap-[7px]">
                    <span className="inline-flex items-center gap-[3px] text-[11px] text-gray-500">{property.category} · {property.listingType}</span>
                    {property.bedrooms > 0 && <span className="inline-flex items-center gap-[3px] text-[11px] text-gray-500"><BedDouble size={14} /> {property.bedrooms} bed</span>}
                    {property.bathrooms > 0 && <span className="inline-flex items-center gap-[3px] text-[11px] text-gray-500"><Bath size={14} /> {property.bathrooms} bath</span>}
                  </div>
                </div>
                <strong className="ml-auto whitespace-nowrap text-[15px]">{propertyPrice}</strong>
              </section>

              <section className="flex min-h-16 items-center justify-between gap-4 rounded-md border border-gray-200 px-[13px] py-[11px] dark:border-white/15">
                <div className="grid gap-[3px]"><strong className="text-[13px] font-medium">Virtual visit</strong><span className="text-[11px] text-gray-500 dark:text-neutral-400">You&apos;ll send them a video link.</span></div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={mode === "virtual"}
                  aria-label="Virtual visit"
                  disabled={!modes.includes("virtual") || !modes.includes("in_person")}
                  className={`relative h-[26px] w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${mode === "virtual" ? "bg-[#703BF7]" : "bg-gray-300"}`}
                  onClick={() => setMode(mode === "virtual" ? "in_person" : "virtual")}
                ><span className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white transition-transform ${mode === "virtual" ? "translate-x-[18px]" : ""}`} /></button>
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
                        className={`grid min-h-9 place-items-center rounded-[3px] text-[13px] hover:bg-gray-100 dark:hover:bg-white/8 disabled:cursor-not-allowed disabled:text-gray-300 dark:disabled:text-neutral-600 ${visitDate === day.value ? "bg-[#703BF7] text-white hover:bg-[#703BF7]" : "bg-transparent text-inherit"}`}
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
                      <span
                        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-200 border-t-[#703BF7] dark:border-white/10 dark:border-t-[#B79BFF]"
                        aria-hidden="true"
                      />
                      <span>Loading visit times…</span>
                    </div>
                  ) : freeSlots.length ? (
                    <div className="grid grid-cols-4 gap-2 max-[430px]:grid-cols-3">
                      {freeSlots.map((slot) => (
                        <button
                          type="button"
                          key={slot.start}
                          className={`grid min-h-[50px] min-w-0 content-center justify-items-center gap-0.5 rounded-[5px] border px-[7px] py-[5px] text-[13px] hover:border-[#703BF7] ${visitTime === slot.start ? "border-[#703BF7] bg-[#703BF7] text-white" : "border-gray-300 bg-white text-gray-900 dark:border-white/15 dark:bg-[#202020] dark:text-white"}`}
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

              <section className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-[23px] dark:border-white/15 max-[430px]:grid-cols-1">
                <label className="grid min-w-0 gap-1.5 text-[13px] font-medium">Customer *<input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Search or add a customer" autoComplete="name" className="min-h-11 w-full rounded-[5px] border border-gray-300 bg-white px-3 text-[13px] outline-none focus:border-[#703BF7] focus:ring-[3px] focus:ring-[#703BF7]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white" /></label>
                <label className="grid min-w-0 gap-1.5 text-[13px] font-medium">Number of visitors<input type="number" min="1" max={selectedSlot?.placesLeft ?? 20} value={visitors} onChange={(event) => setVisitors(Number(event.target.value))} className="min-h-11 w-full rounded-[5px] border border-gray-300 bg-white px-3 text-[13px] outline-none focus:border-[#703BF7] focus:ring-[3px] focus:ring-[#703BF7]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white" /></label>
                <label className="grid min-w-0 gap-1.5 text-[13px] font-medium">Email<input required type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} placeholder="Email address" autoComplete="email" className="min-h-11 w-full rounded-[5px] border border-gray-300 bg-white px-3 text-[13px] outline-none placeholder:text-gray-500 focus:border-[#703BF7] focus:ring-[3px] focus:ring-[#703BF7]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white" /></label>
                <label className="grid min-w-0 gap-1.5 text-[13px] font-medium">Phone<input required type="tel" value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} placeholder="+234..." autoComplete="tel" className="min-h-11 w-full rounded-[5px] border border-gray-300 bg-white px-3 text-[13px] outline-none placeholder:text-gray-500 focus:border-[#703BF7] focus:ring-[3px] focus:ring-[#703BF7]/15 dark:border-white/15 dark:bg-[#101010] dark:text-white" /></label>
              </section>

              <label className="flex items-start gap-2.5 text-xs leading-normal text-gray-500 [&_a]:font-semibold [&_a]:text-[#703BF7] [&_a]:underline dark:text-gray-400 dark:[&_a]:text-[#B79BFF]">
                <input className="mt-0.5 h-[22px] w-[22px] shrink-0 accent-[#703BF7]" type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} required />
                <span>{consentText || "I agree that my details can be used to reply to this request."}</span>
              </label>
            </div>

            <footer className="flex min-h-16 flex-[0_0_auto] items-center justify-between gap-4 border-t border-gray-200 bg-white px-[26px] py-3.5 dark:border-white/15 dark:bg-[#1A1A1A] max-[700px]:px-[18px] max-[700px]:py-3 max-[700px]:pb-[calc(12px+env(safe-area-inset-bottom))] max-[430px]:grid max-[430px]:grid-cols-1 max-[430px]:gap-2">
              <div className="flex items-baseline gap-[5px]"><span className="text-[13px] text-gray-500">Visit fee:</span><strong className="text-sm">{feeLabel}</strong></div>
              <div className="flex items-center gap-[9px] max-[700px]:gap-[7px] max-[430px]:grid max-[430px]:grid-cols-[auto_minmax(0,1fr)]">
                <button type="button" className="min-h-[43px] rounded-[5px] border border-gray-300 bg-white px-[17px] text-[13px] font-medium text-gray-900 dark:border-white/15 dark:bg-[#202020] dark:text-white max-[430px]:w-full max-[430px]:min-w-0 max-[430px]:px-[15px] max-[430px]:text-xs" onClick={() => onOpenChange(false)}>Cancel</button>
                <button type="submit" className="min-h-[43px] rounded-[5px] border border-[#703BF7] bg-[#703BF7] px-[17px] text-[13px] font-semibold text-white hover:bg-[#9677DF] disabled:cursor-not-allowed disabled:opacity-50 max-[430px]:w-full max-[430px]:min-w-0 max-[430px]:px-[15px] max-[430px]:text-xs" disabled={!canSubmit}>
                  {submitting ? "Booking…" : amount === 0 ? "Book visit" : "Book & send payment link"}
                </button>
              </div>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AgentBookInspectionModal;
