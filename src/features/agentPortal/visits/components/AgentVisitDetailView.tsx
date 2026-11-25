import { useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ImagePlus,
  Mail,
  Phone,
  Users,
  Video,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import CustomDropdown from "@/shared/components/CustomDropdown";
import {
  agentAPI,
  agentErrorMessage,
  type AgentBooking,
  type AgentPropertySlot,
} from "@/features/agentPortal/common/services/agentAPI";
import { money } from "@/features/agentPortal/common/utils/agentListingUtils";
import {
  PAYMENT_METHOD_OPTIONS,
  formatVisitDateTime,
  formatVisitTime,
  paymentStatusPillClass,
  visitStatusLabel,
  visitStatusPillClass,
} from "@/features/agentPortal/common/utils/agentVisitUtils";

interface AgentVisitDetailViewProps {
  booking: AgentBooking;
  onClose: () => void;
  onUpdated: (updated: AgentBooking) => void;
  /** Shown in the "Agent" row. Falls back to booking.hostName. */
  agentName?: string;
}

type PanelKey = "reschedule" | "cancel" | null;

const fieldInputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-brand focus:ring-2 focus:ring-brand/15 dark:border-white/15 dark:bg-[#101010] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-light dark:focus:ring-brand-light/15";

const sectionLabel = "m-0 mb-2 text-xs font-medium tracking-wider text-gray-600 uppercase dark:text-gray-400";
const rowClass = "flex min-h-9 items-center justify-between gap-3 text-sm";
const mutedText = "text-gray-600 dark:text-gray-400";
const primaryBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border-0 bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-[#5c2fe0] disabled:cursor-not-allowed disabled:opacity-50";
const outlineBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-[#1a1a1a] dark:text-white dark:hover:border-brand-light dark:hover:text-brand-light";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";

const longDate = (iso: string) => {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(",", "");
};

const toISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const paymentLabel = (status?: string) => (status === "paid" ? "Paid" : status === "void" ? "Void" : "Unpaid");

const AgentVisitDetailView = ({ booking, onClose, onUpdated, agentName }: AgentVisitDetailViewProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [panel, setPanel] = useState<PanelKey>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const date = new Date(`${booking.date}T00:00:00`);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  const [confirming, setConfirming] = useState(false);

  const [rescheduleDate, setRescheduleDate] = useState(booking.date);
  const [rescheduleSlots, setRescheduleSlots] = useState<AgentPropertySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduleStart, setRescheduleStart] = useState(booking.start);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  const [meetingLink, setMeetingLink] = useState(booking.meetingLink ?? "");
  const [savingDetails, setSavingDetails] = useState(false);

  const [outcomeStatus, setOutcomeStatus] = useState<"completed" | "no_show">("completed");
  const [outcomeRemark, setOutcomeRemark] = useState("");
  const [recordingOutcome, setRecordingOutcome] = useState(false);

  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Slide in from the left after first paint
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    window.setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (panel) setPanel(null);
      else handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, panel]);

  useEffect(() => {
    setRescheduleDate(booking.date);
    setRescheduleStart(booking.start);
    setMeetingLink(booking.meetingLink ?? "");
    setPanel(null);
    setCancelReason("");
  }, [booking.date, booking.id, booking.meetingLink, booking.start]);

  useEffect(() => {
    if (!booking.propertyId || !rescheduleDate || booking.status === "cancelled" || booking.status === "completed") {
      setRescheduleSlots([]);
      return;
    }
    let active = true;
    setLoadingSlots(true);
    void agentAPI.getPropertySlots(booking.propertyId, rescheduleDate)
      .then((slots) => {
        if (active) setRescheduleSlots(slots);
      })
      .catch(() => {
        if (active) setRescheduleSlots([]);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [booking.propertyId, booking.status, rescheduleDate]);

  const openPanel = (key: Exclude<PanelKey, null>) => {
    if (key === "reschedule") {
      const date = new Date(`${booking.date}T00:00:00`);
      setRescheduleDate(booking.date);
      setRescheduleStart(booking.start);
      setRescheduleReason("");
      setCalMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    } else {
      setCancelReason("");
    }
    setPanel(key);
  };

  const handleRecordPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecordingPayment(true);
    try {
      const response = await agentAPI.recordBookingPayment(booking.id, {
        method: paymentMethod,
        ...(paymentReference.trim() ? { reference: paymentReference.trim() } : {}),
      });
      toast.success(response.message);
      setPaymentReference("");
      onUpdated(response.data);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't record that payment."));
      console.error("Agent booking payment failed:", error);
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const response = await agentAPI.confirmBooking(booking.id);
      toast.success(response.message);
      onUpdated(response.data);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't confirm this visit."));
      console.error("Agent booking confirm failed:", error);
    } finally {
      setConfirming(false);
    }
  };

  const handleReschedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rescheduleDate || !rescheduleStart || !rescheduleReason.trim()) return;
    setRescheduling(true);
    try {
      const response = await agentAPI.rescheduleBooking(booking.id, {
        date: rescheduleDate,
        start: rescheduleStart,
        ...(rescheduleReason.trim() ? { reason: rescheduleReason.trim() } : {}),
      });
      toast.success(response.message);
      setRescheduleReason("");
      setPanel(null);
      onUpdated(response.data);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't reschedule this visit."));
      console.error("Agent booking reschedule failed:", error);
    } finally {
      setRescheduling(false);
    }
  };

  const handleSaveMeetingLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingDetails(true);
    try {
      const response = await agentAPI.updateBookingDetails(booking.id, { meetingLink: meetingLink.trim() });
      toast.success(response.message);
      onUpdated(response.data);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't save the meeting link."));
      console.error("Agent booking details update failed:", error);
    } finally {
      setSavingDetails(false);
    }
  };

  const handleOutcome = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecordingOutcome(true);
    try {
      const response = await agentAPI.recordBookingOutcome(booking.id, {
        status: outcomeStatus,
        ...(outcomeRemark.trim() ? { remark: outcomeRemark.trim() } : {}),
      });
      toast.success(response.message);
      setOutcomeRemark("");
      onUpdated(response.data);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't record the visit outcome."));
      console.error("Agent booking outcome failed:", error);
    } finally {
      setRecordingOutcome(false);
    }
  };

  const handleCancel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const response = await agentAPI.cancelBooking(booking.id, cancelReason.trim());
      toast.success(response.message);
      setPanel(null);
      setCancelReason("");
      onUpdated(response.data);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't cancel this visit."));
      console.error("Agent booking cancel failed:", error);
    } finally {
      setCancelling(false);
    }
  };

  const copyLink = async (link: string, label: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(`${label} copied.`);
    } catch {
      toast.error("Couldn't copy link to clipboard.");
    }
  };

  const extra = booking as AgentBooking & { source?: string; createdAt?: string; serviceCharge?: number };
  // RewaCiti's service charge is a flat ₦500 unless the API sends one; the rest is the agent's share.
  const serviceCharge = Math.min(extra.serviceCharge ?? 500, booking.fee);
  const yourShare = Math.max(booking.fee - serviceCharge, 0);
  const visitorName = booking.contact?.name || booking.customer?.name || "Visitor";
  const visitorPhone = booking.contact?.phone || booking.customer?.phone || "";
  const visitorEmail = booking.contact?.email || booking.customer?.email || "";
  const hostName = agentName || booking.hostName || "";
  const isFinished = booking.status === "cancelled" || booking.status === "completed" || booking.status === "no_show";
  const isVirtual = booking.mode === "virtual";
  const availableSlots = rescheduleSlots.filter((slot) => slot.available && slot.booked < slot.capacity);
  const isPaid = booking.paymentStatus === "paid";

  const todayISO = toISODate(new Date());
  const monthDays = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const calendarCells: (number | null)[] = [
    ...Array.from({ length: calMonth.getDay() }, () => null),
    ...Array.from({ length: monthDays }, (_, index) => index + 1),
  ];
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const canGoPrev = calMonth.getTime() > currentMonthStart.getTime();
  const monthLabel = calMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const selectedDayLabel = rescheduleDate
    ? new Date(`${rescheduleDate}T00:00:00`)
      .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
      .replace(",", "")
    : "";
  const shiftMonth = (delta: number) =>
    setCalMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <div className="fixed inset-0 z-25" role="presentation">
      <button
        type="button"
        aria-label="Close visit"
        onClick={handleClose}
        className={`absolute inset-0 h-full w-full cursor-default border-0 bg-black/55 p-0 transition-opacity duration-300 motion-reduce:transition-none ${visible ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-visit-detail-title"
        className={`absolute top-0 right-0 flex h-full w-full max-w-[520px] flex-col bg-white text-[#111827] shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none dark:bg-[#1a1a1a] dark:text-white ${visible ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <header className="shrink-0 border-b border-gray-200 px-5 pt-5 pb-4 dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <h1 id="agent-visit-detail-title" className="m-0 text-lg font-bold">
                Visit {booking.reference}
              </h1>
              <span className={visitStatusPillClass(booking.status)}>{visitStatusLabel(booking.status)}</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md border-0 bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {booking.property && (
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded bg-gray-100 text-gray-500 dark:bg-[#232323] dark:text-gray-400">
                {booking.property.photo ? (
                  <img src={booking.property.photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus size={18} />
                )}
              </div>
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-medium">{booking.property.title}</p>
                {booking.address && <p className={`m-0 mt-0.5 truncate text-xs ${mutedText}`}>{booking.address}</p>}
              </div>
            </div>
          )}
        </header>

        {/* Body */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {/* Date card */}
          <section className="rounded-md border border-gray-200 p-4 dark:border-white/10">
            <div className="flex items-start gap-3">
              <CalendarClock size={30} strokeWidth={1.6} className="shrink-0 text-gray-900 dark:text-white" />
              <div className="min-w-0">
                <p className="m-0 text-base font-bold">{longDate(booking.date)}</p>
                <p className={`m-0 mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm ${mutedText}`}>
                  <span>{formatVisitTime(booking.start)} – {formatVisitTime(booking.end)}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={14} /> {booking.visitors} {booking.visitors === 1 ? "visitor" : "visitors"}
                  </span>
                </p>
              </div>
            </div>
            <p className={`mt-3 mb-0 flex items-center gap-2 text-sm ${mutedText}`}>
              {isVirtual ? (
                <>
                  <Video size={15} className="shrink-0" /> Virtual visit · send them the link below
                </>
              ) : (
                <span className="capitalize">{booking.mode.replaceAll("_", " ")} visit</span>
              )}
            </p>
          </section>

          {/* Cancel reason (read-only) */}
          {booking.cancelReason && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-800 dark:bg-red-500/10 dark:text-red-300">
              <strong>Cancel reason:</strong> {booking.cancelReason}
            </div>
          )}

          {/* Confirm banner */}
          {booking.status === "pending_confirmation" && (
            <section className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-4 dark:border-orange-400/25 dark:bg-orange-400/10">
              <p className="m-0 text-sm text-gray-900 dark:text-white">
                {isPaid ? "Paid. Check the time works, then confirm it." : "Not paid yet. Record the payment below, or confirm if you’re happy to proceed."}
              </p>
              <button
                type="button"
                disabled={confirming}
                onClick={() => void handleConfirm()}
                className={`${primaryBtn} mt-3`}
              >
                <CheckCircle2 size={16} /> {confirming ? "Confirming..." : "Confirm visit"}
              </button>
            </section>
          )}

          {/* Visitor */}
          <section className="mt-5">
            <h2 className={sectionLabel}>Visitor</h2>
            <p className="m-0 text-base font-semibold">{visitorName}</p>
            <div className={`mt-2 grid gap-1.5 text-sm ${mutedText}`}>
              {visitorEmail && (
                <a href={`mailto:${visitorEmail}`} className="inline-flex items-center gap-2.5 text-inherit no-underline hover:underline">
                  <Mail size={15} className="shrink-0" /> {visitorEmail}
                </a>
              )}
              {visitorPhone && (
                <a href={`tel:${visitorPhone}`} className="inline-flex items-center gap-2.5 text-inherit no-underline hover:underline">
                  <Phone size={15} className="shrink-0" /> {visitorPhone}
                </a>
              )}
            </div>
          </section>

          <hr className="my-4 border-0 border-t border-gray-200 dark:border-white/10" />

          {/* Meta rows */}
          <section className="grid gap-0.5">
            {hostName && (
              <div className={rowClass}>
                <span className={mutedText}>Agent</span>
                <span className="inline-flex items-center gap-2 font-medium">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand/10 text-[10px] font-bold text-brand dark:bg-brand-light/15 dark:text-brand-light">
                    {initials(hostName)}
                  </span>
                  {hostName}
                </span>
              </div>
            )}
            {extra.source && (
              <div className={rowClass}>
                <span className={mutedText}>Booked through</span>
                <span className="font-medium capitalize">{extra.source.replaceAll("_", " ")}</span>
              </div>
            )}
            {extra.createdAt && (
              <div className={rowClass}>
                <span className={mutedText}>Booked on</span>
                <span className="font-medium">{formatVisitDateTime(extra.createdAt)}</span>
              </div>
            )}
            {booking.notes && (
              <div className="pt-2 text-sm">
                <span className={`mb-1 block ${mutedText}`}>Notes</span>
                <p className="m-0">{booking.notes}</p>
              </div>
            )}
          </section>

          {/* Video link */}
          {isVirtual && !isFinished && (
            <form onSubmit={(event) => void handleSaveMeetingLink(event)} className="mt-4">
              <label htmlFor="agent-visit-meeting-link" className="mb-1.5 block text-sm font-medium">Video link</label>
              <div className="flex items-center gap-2">
                <input
                  id="agent-visit-meeting-link"
                  type="url"
                  required
                  value={meetingLink}
                  onChange={(event) => setMeetingLink(event.target.value)}
                  placeholder="https://meet.google.com/..."
                  className={`${fieldInputClass} h-11`}
                />
                <button
                  type="submit"
                  disabled={savingDetails || !meetingLink.trim() || meetingLink.trim() === (booking.meetingLink ?? "")}
                  className="h-11 shrink-0 rounded-md border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:border-gray-200 disabled:hover:text-gray-400 dark:border-white/10 dark:bg-[#232323] dark:text-white dark:disabled:text-gray-500"
                >
                  {savingDetails ? "Saving..." : booking.meetingLink ? "Update" : "Send"}
                </button>
              </div>
            </form>
          )}

          {/* Record outcome */}
          {booking.status === "confirmed" && (
            <section className="mt-5 rounded-md border border-gray-200 p-4 dark:border-white/10">
              <h2 className="m-0 mb-3 text-sm font-bold">Record visit outcome</h2>
              <form onSubmit={(event) => void handleOutcome(event)} className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  {(["completed", "no_show"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOutcomeStatus(value)}
                      className={`h-9 rounded-md border px-3 text-xs font-semibold transition-colors ${outcomeStatus === value
                        ? "border-brand bg-brand/10 text-brand dark:bg-brand-light/15 dark:text-brand-light"
                        : "border-gray-300 bg-white text-gray-700 dark:border-white/15 dark:bg-[#101010] dark:text-gray-300"}`}
                    >
                      {value === "completed" ? "Completed" : "No show"}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  maxLength={400}
                  value={outcomeRemark}
                  onChange={(event) => setOutcomeRemark(event.target.value)}
                  placeholder="Remark (optional), e.g. They liked the flat"
                  aria-label="Outcome remark"
                  className={fieldInputClass}
                />
                <div className="flex justify-end">
                  <button type="submit" disabled={recordingOutcome} className={`${primaryBtn} h-9`}>
                    {recordingOutcome ? "Saving..." : "Save outcome"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <hr className="my-4 border-0 border-t border-gray-200 dark:border-white/10" />

          {/* Visit fee */}
          <section>
            <h2 className={sectionLabel}>Visit fee</h2>
            <div className={rowClass}>
              <span className={mutedText}>Amount</span>
              <span className="inline-flex items-center gap-2 font-semibold">
                {money(booking.fee)}
                <span className={paymentStatusPillClass(booking.paymentStatus)}>{paymentLabel(booking.paymentStatus)}</span>
              </span>
            </div>
            <div className={rowClass}>
              <span className={mutedText}>For your time</span>
              <span className="font-medium">{money(yourShare)}</span>
            </div>
            <div className={rowClass}>
              <span className={mutedText}>Service charge (RewaCiti)</span>
              <span className="font-medium">{money(serviceCharge)}</span>
            </div>
            {booking.invoice && (
              <div className={rowClass}>
                <span className={mutedText}>Invoice</span>
                <span className="font-medium">{booking.invoice.number}</span>
              </div>
            )}
            {booking.invoice?.paymentLink && booking.paymentStatus === "unpaid" && (
              <button
                type="button"
                onClick={() => void copyLink(booking.invoice!.paymentLink!, "Payment link")}
                className={`${outlineBtn} mt-2 h-9 w-full`}
              >
                <Copy size={14} /> Copy payment link
              </button>
            )}
            {booking.manageLink && (
              <button
                type="button"
                onClick={() => void copyLink(booking.manageLink!, "Manage link")}
                className={`${outlineBtn} mt-2 h-9 w-full`}
              >
                <Copy size={14} /> Copy visitor manage link
              </button>
            )}

            {booking.paymentStatus === "unpaid" && booking.status !== "cancelled" && (
              <form
                onSubmit={(event) => void handleRecordPayment(event)}
                className="mt-3 grid gap-3 rounded-md border border-gray-200 p-3 dark:border-white/10"
              >
                <p className={`m-0 text-xs ${mutedText}`}>
                  Mark the {money(booking.fee)} visit fee as paid once you’ve received it directly.
                </p>
                <CustomDropdown
                  className="w-full"
                  buttonClassName="h-10 w-full rounded-md border border-gray-300 bg-white! px-3 text-left text-sm text-gray-900! hover:border-brand dark:border-white/15 dark:bg-[#101010]! dark:text-white!"
                  menuClassName="overflow-hidden rounded-xl border-gray-300! bg-white! text-gray-900! shadow-lg! dark:border-white/15! dark:bg-[#1a1a1a]! dark:text-white!"
                  menuItemClassName="block w-full bg-white! px-4 py-2.5 text-left text-sm text-gray-900! transition hover:bg-gray-100! dark:bg-[#1a1a1a]! dark:text-white! dark:hover:bg-neutral-800!"
                  placeholder="Select method"
                  value={paymentMethod}
                  options={PAYMENT_METHOD_OPTIONS}
                  onChange={setPaymentMethod}
                />
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  placeholder="Reference, e.g. GTB-TRF-114522"
                  aria-label="Payment reference"
                  className={fieldInputClass}
                />
                <button type="submit" disabled={recordingPayment} className={`${primaryBtn} h-9`}>
                  {recordingPayment ? "Recording..." : "Record payment"}
                </button>
              </form>
            )}
          </section>

          <hr className="my-4 border-0 border-t border-gray-200 dark:border-white/10" />

          {/* Activity */}
          <section>
            <h2 className={sectionLabel}>Activity</h2>
            {booking.timeline.length ? (
              <ol className="m-0 list-none p-0">
                {booking.timeline.map((entry, index) => {
                  const isLast = index === booking.timeline.length - 1;
                  return (
                    <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                      {!isLast && (
                        <span className="absolute top-4 bottom-0 left-[4px] w-px bg-gray-300 dark:bg-white/15" aria-hidden="true" />
                      )}
                      <span className="relative z-[1] mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full bg-gray-900 dark:bg-white" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-sm leading-snug">{entry.label}</p>
                        {entry.remark && <p className={`mt-0.5 mb-0 text-xs ${mutedText}`}>“{entry.remark}”</p>}
                        <p className="mt-0.5 mb-0 text-xs text-gray-500 dark:text-gray-400">
                          {entry.by} · {formatVisitDateTime(entry.at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="m-0 text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
            )}
          </section>
        </div>

        {/* Sticky footer actions */}
        {!isFinished && (
          <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-gray-200 bg-white px-5 py-3 dark:border-white/10 dark:bg-[#1a1a1a]">
            <button
              type="button"
              onClick={() => openPanel("cancel")}
              aria-haspopup="dialog"
              className={`${outlineBtn} h-11`}
            >
              <XCircle size={16} /> Cancel visit
            </button>
            <button
              type="button"
              onClick={() => openPanel("reschedule")}
              aria-haspopup="dialog"
              className={`${primaryBtn} h-11`}
            >
              <CalendarClock size={16} /> Reschedule
            </button>
          </footer>
        )}
      </aside>

      {/* Reschedule modal */}
      {panel === "reschedule" && !isFinished && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/55 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPanel(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-visit-reschedule-title"
            className="w-full max-w-[740px] rounded-md bg-white text-[#111827] shadow-2xl dark:bg-[#1a1a1a] dark:text-white"
          >
            <form onSubmit={(event) => void handleReschedule(event)}>
              <div className="flex items-start justify-between gap-3 px-6 pt-6">
                <div>
                  <h2 id="agent-visit-reschedule-title" className="m-0 text-lg font-bold">Reschedule visit</h2>
                  <p className={`mt-1 mb-0 text-sm ${mutedText}`}>The visitor will be told about the new time.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  aria-label="Close"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md border-0 bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid items-start gap-5 px-6 pt-5 md:grid-cols-[300px_minmax(0,1fr)]">
                {/* Calendar */}
                <div className="rounded-md border border-gray-200 p-3 dark:border-white/10">
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <strong className="text-sm font-medium">{monthLabel}</strong>
                    <div className="inline-flex overflow-hidden rounded border border-gray-200 dark:border-white/10">
                      <button
                        type="button"
                        aria-label="Previous month"
                        disabled={!canGoPrev}
                        onClick={() => shiftMonth(-1)}
                        className="grid h-6 w-6 place-items-center border-0 bg-transparent disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Next month"
                        onClick={() => shiftMonth(1)}
                        className="grid h-6 w-6 place-items-center border-0 border-l border-gray-200 bg-transparent dark:border-white/10"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-y-1 text-center">
                    {WEEKDAYS.map((day) => (
                      <span key={day} className={`py-1.5 text-xs ${mutedText}`}>{day}</span>
                    ))}
                    {calendarCells.map((day, index) => {
                      if (day === null) return <span key={`blank-${index}`} />;
                      const iso = toISODate(new Date(calMonth.getFullYear(), calMonth.getMonth(), day));
                      const isPast = iso < todayISO;
                      const isSelected = iso === rescheduleDate;
                      const isToday = iso === todayISO;
                      return (
                        <button
                          key={iso}
                          type="button"
                          disabled={isPast}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setRescheduleDate(iso);
                            setRescheduleStart("");
                          }}
                          className={`mx-auto grid h-10 w-10 place-items-center rounded-md border-0 text-sm transition-colors ${isSelected
                            ? "bg-brand font-semibold text-white"
                            : isPast
                              ? "cursor-not-allowed bg-transparent text-gray-400 dark:text-gray-600"
                              : isToday
                                ? "bg-brand/15 font-semibold text-brand hover:bg-brand/25 dark:text-brand-light"
                                : "bg-transparent hover:bg-gray-100 dark:hover:bg-neutral-800"}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                <div>
                  <p className="m-0 mb-3 text-sm font-medium">{selectedDayLabel}</p>
                  {loadingSlots ? (
                    <p className={`m-0 text-sm ${mutedText}`}>Checking available times…</p>
                  ) : availableSlots.length === 0 ? (
                    <p className={`m-0 text-sm ${mutedText}`}>No available times on this day. Pick another date.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {availableSlots.map((slot) => {
                        const selected = rescheduleStart === slot.start;
                        return (
                          <button
                            key={slot.start}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setRescheduleStart(slot.start)}
                            className={`grid min-h-[76px] content-center justify-items-center gap-0.5 rounded-md border px-1 py-2 text-center text-sm transition-colors ${selected
                              ? "border-brand bg-brand/10 font-semibold text-brand dark:border-brand-light dark:bg-brand-light/15 dark:text-brand-light"
                              : "border-gray-200 bg-white hover:border-brand dark:border-white/10 dark:bg-[#1a1a1a]"}`}
                          >
                            <span>{formatVisitTime(slot.start)}</span>
                            <span className={`text-xs font-normal ${selected ? "" : mutedText}`}>
                              {slot.capacity - slot.booked} left
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pt-5">
                <label htmlFor="agent-visit-reschedule-reason" className="mb-1.5 block text-sm font-medium">
                  Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="agent-visit-reschedule-reason"
                  required
                  rows={3}
                  maxLength={300}
                  value={rescheduleReason}
                  onChange={(event) => setRescheduleReason(event.target.value)}
                  placeholder="Shared with the visitor"
                  className={`${fieldInputClass} min-h-[84px] resize-y`}
                />
              </div>

              <div className="mt-5 flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-white/10">
                <button type="button" onClick={() => setPanel(null)} className={outlineBtn}>Go back</button>
                <button
                  type="submit"
                  disabled={rescheduling || !rescheduleDate || !rescheduleStart || !rescheduleReason.trim()}
                  className={primaryBtn}
                >
                  {rescheduling ? "Moving..." : "Move visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {panel === "cancel" && !isFinished && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/55 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPanel(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-visit-cancel-title"
            className="w-full max-w-[504px] rounded-md bg-white p-6 text-[#111827] shadow-2xl dark:bg-[#1a1a1a] dark:text-white"
          >
            <form onSubmit={(event) => void handleCancel(event)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="agent-visit-cancel-title" className="m-0 text-lg font-bold">Cancel this visit?</h2>
                  <p className={`mt-1 mb-0 text-sm ${mutedText}`}>The visit fee will not be refunded.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  aria-label="Close"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md border-0 bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800"
                >
                  <X size={20} />
                </button>
              </div>

              <label htmlFor="agent-visit-cancel-reason" className="mt-5 mb-1.5 block text-sm font-medium">
                Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                id="agent-visit-cancel-reason"
                required
                rows={3}
                maxLength={400}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="Shared with the visitor"
                className={`${fieldInputClass} min-h-[84px] resize-y`}
              />

              <div className="mt-4 flex justify-end gap-3">
                <button type="button" disabled={cancelling} onClick={() => setPanel(null)} className={outlineBtn}>
                  Keep visit
                </button>
                <button
                  type="submit"
                  disabled={cancelling || !cancelReason.trim()}
                  className="inline-flex h-10 items-center justify-center rounded-md border-0 bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {cancelling ? "Cancelling..." : "Cancel visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentVisitDetailView;