import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import axios from "axios";
import * as Dialog from "@radix-ui/react-dialog";
import {
  FiCalendar,
  FiChevronDown,
  FiCheck,
  FiDollarSign,
  FiFileText,
  FiHeart,
  FiLogOut,
  FiMessageSquare,
  FiStar,
  FiUser,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";
import Navbar from "../../../shared/components/Layout/Navbar";
import Footer from "../../../shared/components/Layout/Footer";
import { Skeleton } from "../../../shared/components/ui/Skeleton";
import { errorMessage, noteTestMode, realEstateApi } from "../../../shared/lib/realEstateApi";
import { payInvoice } from "../../../shared/lib/payments";
import { visitsAPI } from "../../inspections/services/visitsAPI";
import { requestsAPI } from "../../properties/services/requestsAPI";
import { authAPI } from "../services/authAPI";
import type { ProfileResponse } from "../services/authAPI";
import {
  accountAPI,
  type AccountDeal,
  type AccountInquiry,
  type AccountRequest,
  type AccountVisit,
} from "../services/accountAPI";
import { useAuthStore } from "../store/useAuthStore";
import { usePropertyStore } from "../../properties/store/usePropertyStore";
import { propertiesAPI } from "../../properties/services/propertiesAPI";
import { toProperty } from "../../properties/services/toProperty";
import type { Property } from "../../../types";
import type { VisitSlot } from "../../../types/realEstate";

type AccountTab = "saved" | "visits" | "payments" | "messages" | "profile";
type VisitFilter = "upcoming" | "all";

// Same container as the Navbar and PropertyDetails so everything lines up.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Same serif as the Navbar / Home hero (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

const tabs: { id: AccountTab; label: string; icon: typeof FiHeart }[] = [
  { id: "saved", label: "Saved", icon: FiHeart },
  { id: "visits", label: "Visits", icon: FiCalendar },
  { id: "payments", label: "Payments", icon: FiDollarSign },
  { id: "messages", label: "Messages", icon: FiMessageSquare },
  { id: "profile", label: "Profile", icon: FiUser },
];

const isAccountTab = (value: string | null): value is AccountTab =>
  tabs.some((tab) => tab.id === value);

const cardClass =
  "rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#1A1A1A] sm:p-7";
const paymentCardClass =
  "rounded-3xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#1A1A1A] sm:p-5";
const primaryButtonClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#703BF7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9677df] disabled:cursor-not-allowed disabled:opacity-60";
const pillButtonClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:border-[#703BF7] hover:text-[#703BF7] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:bg-transparent dark:text-white";
const inputClass =
  "mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal text-gray-900 outline-none transition focus:border-[#703BF7] dark:border-white/15 dark:bg-[#101010] dark:text-white";
const headingClass = "font-semibold text-gray-900 dark:text-white";
const mutedClass = "text-gray-600 dark:text-gray-400";

// ---------- formatting helpers ----------

const formatMoney = (amount: number) =>
  `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(amount)}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));

const todayISODate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const formatTime = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

// "Wednesday, 11 November at 8:00 AM"
const formatVisitWhen = (date: string, start: string) => {
  const d = new Date(`${date}T00:00:00`);
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(d);
  const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(d);
  return `${weekday}, ${dayMonth} at ${formatTime(start)}`;
};

const statusLabel = (status: string) =>
  status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const INACTIVE_VISIT = ["cancelled", "completed", "no_show", "expired"];

const statusTone = (status: string) => {
  const s = status.toLowerCase();
  if (/(cancel|expire|no_show|fail|reject)/.test(s))
    return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  if (/(pend|wait|await|request|partial|unpaid)/.test(s))
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  if (/(complete|paid|confirm|approved|success)/.test(s))
    return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300";
  return "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300";
};

const StatusChip = ({ status }: { status: string }) => (
  <span
    className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusTone(status)}`}
  >
    {statusLabel(status)}
  </span>
);

// Downloads a receipt with the authenticated API client without navigating away.
const downloadFile = async (url: string, baseName: string) => {
  const baseURL = realEstateApi.defaults.baseURL;
  if (!baseURL) throw new Error("The receipt service isn't configured.");

  const receiptUrl = new URL(url, baseURL);
  const apiUrl = new URL(baseURL);
  if (receiptUrl.protocol !== "http:" && receiptUrl.protocol !== "https:") {
    throw new Error("This receipt link is not a valid web address.");
  }
  if (receiptUrl.origin !== apiUrl.origin) {
    const anchor = document.createElement("a");
    anchor.href = receiptUrl.href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
    return;
  }

  const { data: blob } = await realEstateApi.get<Blob>(receiptUrl.href, {
    responseType: "blob",
  });
  if (blob.type.includes("text/html")) {
    throw new Error("The receipt service returned a web page instead of a downloadable file.");
  }
  const ext = blob.type.includes("pdf")
    ? "pdf"
    : blob.type.split("/")[1]?.split("+")[0] || "pdf";
  const safeName = baseName.replace(/[^\w.-]+/g, "-");
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${safeName}.${ext}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

const visitActionErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return errorMessage(error, fallback);
};

// ---------- small shared components ----------

const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex min-h-[330px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-400 px-5 py-12 text-center dark:border-white/20">
    <div className="mb-5 text-gray-500 dark:text-gray-500">{icon}</div>
    <h2 style={SERIF} className={`text-2xl ${headingClass}`}>
      {title}
    </h2>
    <p className={`mt-2 max-w-md text-sm ${mutedClass}`}>{description}</p>
    {action && <div className="mt-7">{action}</div>}
  </div>
);

const AccountSkeleton = ({ tab }: { tab: AccountTab }) => {
  const visitCard = () => (
    <article className={cardClass} aria-hidden="true">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-7 w-3/5" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-4 w-3/5" />
      <Skeleton className="mt-2 h-4 w-1/4" />
      <div className="mt-5 flex gap-3">
        <Skeleton className="h-12 w-36 rounded-full" />
        <Skeleton className="h-12 w-24 rounded-full" />
      </div>
    </article>
  );

  const paymentCard = () => (
    <article className={paymentCardClass} aria-hidden="true">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-6 w-3/5" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-4 w-2/5" />
      <div className="mt-3 space-y-2 rounded-2xl border border-gray-300/70 bg-gray-100 p-3 dark:border-white/10 dark:bg-black/30">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
        <div className="border-t border-gray-300/70 pt-2 dark:border-white/10">
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-300/70 bg-gray-100 p-3 dark:border-white/10 dark:bg-black/30"
          >
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-gray-300/70 pt-3 dark:border-white/10">
        <Skeleton className="h-5 w-32" />
      </div>
    </article>
  );

  const profileSkeleton = (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={`${cardClass} space-y-5`}>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-11 w-36 rounded-full" />
      </div>
      <div className={`${cardClass} space-y-5`}>
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>
    </div>
  );

  let content: React.ReactNode;
  switch (tab) {
    case "saved":
      content = (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <article
              key={item}
              className={`${cardClass} overflow-hidden p-0 sm:p-0`}
              aria-hidden="true"
            >
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-5 w-1/3" />
                <div className="mt-5 flex justify-between border-t border-gray-200 pt-4 dark:border-white/10">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </article>
          ))}
        </div>
      );
      break;
    case "visits":
      content = (
        <div className="space-y-5">
          <Skeleton className="h-11 w-56 rounded-full" />
          {visitCard()}
          {visitCard()}
        </div>
      );
      break;
    case "payments":
      content = (
        <div className="w-full space-y-5">
          {paymentCard()}
          {paymentCard()}
        </div>
      );
      break;
    case "messages":
      content = (
        <div className="space-y-4">
          {[0, 1, 2].map((item) => (
            <article key={item} className={cardClass} aria-hidden="true">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-6 w-2/3" />
                </div>
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
              <div className="mt-5 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </article>
          ))}
        </div>
      );
      break;
    case "profile":
      content = profileSkeleton;
      break;
    default:
      content = profileSkeleton;
  }

  const tabLabel = tabs.find((item) => item.id === tab)?.label.toLowerCase() ?? "account";
  return (
    <div role="status" aria-label={`Loading ${tabLabel}`} aria-live="polite">
      <span className="sr-only">Loading {tabLabel}</span>
      {content}
    </div>
  );
};

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <span className="text-sm font-medium text-gray-900 dark:text-white">
    {children}
    {required && <span className="ml-1 text-red-600">*</span>}
  </span>
);

// ---------- payments ----------

// The API type may not expose these yet; they are optional so the card
// degrades to just the "Paid so far" row when they are missing.
type DealView = AccountDeal & { createdAt?: string };

const DealCard = ({
  deal,
  email,
  onPaymentComplete,
}: {
  deal: DealView;
  email: string;
  onPaymentComplete: () => void;
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const handleReceipt = async (payment: AccountDeal["payments"][number]) => {
    if (!payment.receiptLink) return;
    setDownloadingId(String(payment.invoiceId));
    try {
      await downloadFile(payment.receiptLink, `Receipt-${deal.number}-${payment.label}`);
    } catch (error) {
      console.error("Receipt download failed:", error);
      toast.error(errorMessage(error, "Couldn't download your receipt. Please try again."));
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePayment = async (payment: AccountDeal["payments"][number]) => {
    if (!payment.invoiceId) return;
    if (!email) {
      toast.error("Add an email address to your account before paying.");
      return;
    }

    setPayingId(payment.invoiceId);
    try {
      const outcome = await payInvoice({
        invoiceId: payment.invoiceId,
        email,
        paymentLink: payment.paymentLink,
        allowRedirect: false,
      });
      if (outcome === "paid") {
        toast.success("Payment successful.");
        onPaymentComplete();
      } else if (outcome === "pending") {
        toast.info("Payment received and is awaiting confirmation.");
        onPaymentComplete();
      } else if (outcome === "cancelled") {
        toast.info("Payment cancelled.");
      } else if (outcome === "failed") {
        toast.error("The payment didn't go through. Please try again.");
      }
    } catch (error) {
      console.error("Payment flow error:", error);
      toast.error(errorMessage(error, "Couldn't start your payment. Please try again."));
    } finally {
      setPayingId(null);
    }
  };

  const handleRateService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rating) {
      toast.error("Choose a rating before submitting.");
      return;
    }

    setIsSubmittingRating(true);
    try {
      const response = await requestsAPI.rating({
        type: "deal",
        reference: deal.number,
        email: email || undefined,
        stars: rating,
        comment: feedback.trim() || undefined,
      });
      noteTestMode(response);
      toast.success("Thank you for your feedback!");
      setIsRatingOpen(false);
      setRating(0);
      setFeedback("");
    } catch (error) {
      console.error("Failed to submit service rating:", error);
      toast.error(errorMessage(error, "Couldn't submit your rating. Please try again."));
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const cautionLine = deal.lines.find((line) => /caution/i.test(line.label));
  const isComplete = deal.paid >= deal.amount && deal.amount > 0;

  return (
    <article className={paymentCardClass}>
      <div className="flex items-start justify-between gap-4">
        <h2 style={SERIF} className={`text-xl sm:text-2xl ${headingClass}`}>
          {deal.propertyTitle}
        </h2>
        <StatusChip status={isComplete ? "complete" : deal.status} />
      </div>
      <p className={`mt-1.5 text-sm ${mutedClass}`}>
        Ref {deal.number}
        {deal.createdAt ? ` · ${formatDate(deal.createdAt)}` : ""}
      </p>

      <div className="mt-3 rounded-2xl border border-gray-300/70 bg-gray-100 p-3 dark:border-white/10 dark:bg-black/30 sm:p-4">
        {deal.lines.length > 0 && (
          <dl className="space-y-1.5 border-b border-gray-300/70 pb-3 dark:border-white/10">
            {deal.lines.map((line) => (
              <div key={line.label} className="flex items-baseline justify-between gap-4">
                <dt className={`text-sm ${mutedClass}`}>{line.label}</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {formatMoney(line.amount)}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <div
          className={`flex items-baseline justify-between gap-4 ${
            deal.lines.length ? "pt-3" : ""
          }`}
        >
          <span className={`${headingClass} text-sm`}>Paid so far</span>
          <span className={`${headingClass} text-sm`}>
            {formatMoney(deal.paid)} of {formatMoney(deal.amount)}
          </span>
        </div>
      </div>

      {cautionLine ? (
        <p className={`mt-2 text-sm ${mutedClass}`}>
          Caution fee: {formatMoney(cautionLine.amount)} · held for you
        </p>
      ) : null}

      {deal.payments.length > 0 && (
        <div className="mt-3 space-y-2">
          {deal.payments.map((payment) => {
            const isPaid = payment.status === "paid";
            return (
              <div
                key={payment.invoiceId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-300/70 bg-gray-100 p-3 dark:border-white/10 dark:bg-black/30"
              >
                <div>
                  <p className={headingClass}>{payment.label}</p>
                  <p className={`mt-0.5 text-sm ${mutedClass}`}>
                    {formatMoney(payment.amount)} ·{" "}
                    {payment.paidAt
                      ? `paid ${formatDate(payment.paidAt)}`
                      : statusLabel(payment.status).toLowerCase()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {!isPaid && payment.invoiceId && (
                    <button
                      type="button"
                      onClick={() => void handlePayment(payment)}
                      disabled={payingId === payment.invoiceId}
                      className={`${primaryButtonClass} py-2.5!`}
                    >
                      {payingId === payment.invoiceId ? "Starting…" : "Pay now"}
                    </button>
                  )}
                  {payment.receiptLink && (
                    <button
                      type="button"
                      onClick={() => void handleReceipt(payment)}
                      disabled={downloadingId === String(payment.invoiceId)}
                      className={`${pillButtonClass} px-5 py-2.5!`}
                    >
                      <FiFileText size={16} />
                      {downloadingId === String(payment.invoiceId)
                        ? "Loading…"
                        : "View Reciept"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isComplete && (
        <button
          type="button"
          onClick={() => setIsRatingOpen(true)}
          className="mt-1.5 cursor-pointer text-sm font-semibold text-[#703BF7] hover:underline dark:text-[#b79bff]"
        >
          Rate our service
        </button>
      )}

      <Dialog.Root open={isRatingOpen} onOpenChange={setIsRatingOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/50" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-60 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white p-6 text-gray-900 shadow-2xl outline-none dark:bg-[#1A1A1A] dark:text-white sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title style={SERIF} className="text-2xl font-semibold">
                  Rate our service
                </Dialog.Title>
                <Dialog.Description className={`mt-1 text-sm ${mutedClass}`}>
                  Share your experience with this purchase.
                </Dialog.Description>
              </div>
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
            <form onSubmit={handleRateService} className="mt-6 space-y-5">
              <div className="flex justify-center gap-2" role="group" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} star${star === 1 ? "" : "s"}`}
                    aria-pressed={rating === star}
                    onClick={() => setRating(star)}
                    className="cursor-pointer p-1 text-[#703BF7] transition hover:scale-110"
                  >
                    <FiStar
                      size={30}
                      className={star <= rating ? "fill-current" : ""}
                    />
                  </button>
                ))}
              </div>
              <label className="block text-sm font-medium">
                Feedback <span className={mutedClass}>(optional)</span>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  className={inputClass}
                />
              </label>
              <button
                type="submit"
                disabled={isSubmittingRating}
                className={`${primaryButtonClass} w-full`}
              >
                {isSubmittingRating ? "Submitting…" : "Submit rating"}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </article>
  );
};

// ---------- visits ----------

const VisitCard = ({
  visit,
  email,
  onPaymentComplete,
  onVisitUpdated,
}: {
  visit: AccountVisit;
  email: string;
  onPaymentComplete: () => void;
  onVisitUpdated: (visit: AccountVisit) => void;
}) => {
  const [isPaying, setIsPaying] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [reason, setReason] = useState("");
  const [slots, setSlots] = useState<VisitSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const isInactive = INACTIVE_VISIT.includes(visit.status);
  const canReschedule = visit.canReschedule ?? (visit.paid && !isInactive);
  const canCancel = visit.canCancel ?? !isInactive;

  useEffect(() => {
    setStart("");
    setSlots([]);
    if (!isRescheduleOpen || !date) return;

    let cancelled = false;
    setIsLoadingSlots(true);
    visitsAPI
      .slots(visit.propertyId, date)
      .then((availableSlots) => {
        if (!cancelled) setSlots(availableSlots.filter((slot) => slot.available));
      })
      .catch((error) => {
        console.error("Failed to load rescheduling slots:", error);
        if (!cancelled) {
          toast.error(errorMessage(error, "Couldn't load available times. Please try again."));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date, isRescheduleOpen, visit.propertyId]);

  const finishVisitAction = (response: { message: string; data: AccountVisit; test?: boolean }) => {
    noteTestMode(response);
    if (response.test) return false;
    onVisitUpdated(response.data);
    toast.success(response.message);
    return true;
  };

  const handleReschedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!date || !start) return;

    setIsSubmittingChange(true);
    try {
      const response = await accountAPI.rescheduleVisit(visit.id, {
        date,
        start,
      });
      if (finishVisitAction(response)) setIsRescheduleOpen(false);
    } catch (error) {
      console.error("Failed to reschedule visit:", error);
      toast.error(visitActionErrorMessage(error, "Couldn't change your visit time. Please try again."));
    } finally {
      setIsSubmittingChange(false);
    }
  };

  const handleCancelVisit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason.trim()) return;

    setIsSubmittingChange(true);
    try {
      const response = await accountAPI.cancelVisit(visit.id, { reason: reason.trim() });
      if (finishVisitAction(response)) setIsCancelOpen(false);
    } catch (error) {
      console.error("Failed to cancel visit:", error);
      toast.error(visitActionErrorMessage(error, "Couldn't cancel your visit. Please try again."));
    } finally {
      setIsSubmittingChange(false);
    }
  };

  const handlePayment = async () => {
    if (!visit.invoiceId) return;
    if (!email) {
      toast.error("Add an email address to your account before paying.");
      return;
    }

    setIsPaying(true);
    try {
      const outcome = await payInvoice({
        invoiceId: visit.invoiceId,
        email,
        paymentLink: visit.paymentLink,
        allowRedirect: false,
      });
      if (outcome === "paid") {
        toast.success("Payment successful.");
        onPaymentComplete();
      } else if (outcome === "pending") {
        toast.info("Payment received and is awaiting confirmation.");
        onPaymentComplete();
      } else if (outcome === "cancelled") {
        toast.info("Payment cancelled.");
      } else if (outcome === "failed") {
        toast.error("The payment didn't go through. Please try again.");
      }
    } catch (error) {
      console.error("Visit payment flow error:", error);
      toast.error(errorMessage(error, "Couldn't start your payment. Please try again."));
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <article className={cardClass}>
      <div className="flex flex-col items-end gap-2 md:flex-row md:items-start md:justify-between">
        <h2 style={SERIF} className={`order-2 self-start text-xl sm:text-2xl md:order-1 ${headingClass}`}>
          {visit.propertyTitle}
        </h2>
        <div className="order-1 md:order-2">
          <StatusChip status={visit.status} />
        </div>
      </div>
      <p className={`mt-2 ${mutedClass}`}>
        {formatVisitWhen(visit.date, visit.start)} ·{" "}
        {visit.mode === "virtual" ? "Virtual" : "In person"}
      </p>
      <p className={`mt-1 text-sm ${mutedClass}`}>Ref {visit.reference}</p>

      {((!visit.paid && visit.paymentLink && visit.invoiceId) ||
        (!isInactive && (visit.canReschedule !== false || visit.canCancel !== false))) && (
        <div className="mt-5 flex flex-wrap gap-3">
          {!visit.paid && visit.paymentLink && visit.invoiceId && (
            <button
              type="button"
              onClick={() => void handlePayment()}
              disabled={isPaying}
              className={primaryButtonClass}
            >
              {isPaying ? "Starting…" : "Pay visit fee"}
            </button>
          )}
          {!isInactive && visit.canReschedule !== false && (
            <button
              type="button"
              onClick={() => {
                setReason("");
                setDate("");
                setIsRescheduleOpen(true);
              }}
              className={pillButtonClass}
            >
              Change time
            </button>
          )}
          {!isInactive && visit.canCancel !== false && (
            <button
              type="button"
              onClick={() => {
                setReason("");
                setIsCancelOpen(true);
              }}
              className={pillButtonClass}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {!isInactive && visit.rescheduleBlockedReason && !canReschedule && (
        <p className={`mt-3 text-sm ${mutedClass}`}>{visit.rescheduleBlockedReason}</p>
      )}
      {!isInactive && visit.cancelBlockedReason && !canCancel && (
        <p className={`mt-2 text-sm ${mutedClass}`}>{visit.cancelBlockedReason}</p>
      )}

      <Dialog.Root
        open={isRescheduleOpen}
        onOpenChange={(open) => {
          setIsRescheduleOpen(open);
          if (!open) {
            setDate("");
            setStart("");
            setReason("");
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/50" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-60 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white p-6 text-gray-900 shadow-2xl outline-none dark:bg-[#1A1A1A] dark:text-white sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title style={SERIF} className="text-2xl font-semibold">
                  Change visit time
                </Dialog.Title>
                <Dialog.Description className={`mt-1 text-sm ${mutedClass}`}>
                  {visit.propertyTitle}
                </Dialog.Description>
              </div>
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
            <form onSubmit={handleReschedule} className="mt-6 space-y-5">
              <label className="block">
                <FieldLabel required>New date</FieldLabel>
                <input
                  required
                  type="date"
                  min={todayISODate()}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <FieldLabel required>Available time</FieldLabel>
                <div className="relative">
                  <select
                    required
                    value={start}
                    onChange={(event) => setStart(event.target.value)}
                    disabled={!date || isLoadingSlots || slots.length === 0}
                    className={`${inputClass} cursor-pointer appearance-none pr-10 disabled:cursor-not-allowed disabled:text-gray-400`}
                  >
                    <option value="">
                      {!date
                        ? "Choose a date first"
                        : isLoadingSlots
                          ? "Loading available times…"
                          : slots.length
                            ? "Choose a time"
                            : "No available times"}
                    </option>
                    {slots.map((slot) => (
                      <option key={slot.start} value={slot.start}>
                        {formatTime(slot.start)}
                        {slot.end ? ` – ${formatTime(slot.end)}` : ""}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-gray-500"
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={!date || !start || isSubmittingChange}
                className={`${primaryButtonClass} w-full`}
              >
                {isSubmittingChange ? "Changing…" : "Confirm new time"}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={isCancelOpen}
        onOpenChange={(open) => {
          setIsCancelOpen(open);
          if (!open) setReason("");
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/50" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-60 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white p-6 text-gray-900 shadow-2xl outline-none dark:bg-[#1A1A1A] dark:text-white sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title style={SERIF} className="text-2xl font-semibold">
                  Cancel this visit?
                </Dialog.Title>
                <Dialog.Description className={`mt-1 text-sm ${mutedClass}`}>
                  {visit.propertyTitle} · {formatVisitWhen(visit.date, visit.start)}
                </Dialog.Description>
              </div>
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
            {visit.paid && (
              <p className={`mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200`}>
                Your visit fee stays as credit for your next visit. The service charge isn’t refunded.
              </p>
            )}
            <form onSubmit={handleCancelVisit} className="mt-5 space-y-5">
              <label className="block">
                <FieldLabel required>Reason for cancelling</FieldLabel>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className={inputClass}
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={!reason.trim() || isSubmittingChange}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingChange ? "Cancelling…" : "Cancel visit"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCancelOpen(false)}
                  className={`${pillButtonClass} flex-1`}
                >
                  Keep visit
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </article>
  );
};

// ---------- page ----------

const AccountPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const customer = useAuthStore((state) => state.customer);
  const logout = useAuthStore((state) => state.logout);
  const setCustomer = useAuthStore((state) => state.setCustomer);
  const savedProperties = usePropertyStore((state) => state.shortlistedProperties);

  const [activeTab, setActiveTab] = useState<AccountTab>(() =>
    isAccountTab(requestedTab) ? requestedTab : "profile",
  );
  const [visitFilter, setVisitFilter] = useState<VisitFilter>("upcoming");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [visits, setVisits] = useState<AccountVisit[]>([]);
  const [deals, setDeals] = useState<AccountDeal[]>([]);
  const [inquiries, setInquiries] = useState<AccountInquiry[]>([]);
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const loadRequestId = useRef(0);

  useEffect(() => {
    if (isAccountTab(requestedTab)) {
      setActiveTab(requestedTab);
    } else if (!requestedTab) {
      setActiveTab("profile");
    }
  }, [requestedTab]);

  const loadAccountSection = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setIsLoading(true);
    try {
      switch (activeTab) {
        case "saved": {
          const saved = await propertiesAPI.saved();
          if (requestId !== loadRequestId.current) return;
          usePropertyStore.setState({
            shortlistedProperties: saved.map((listing) => toProperty(listing)),
          });
          break;
        }
        case "visits": {
          const result = await accountAPI.visits();
          if (requestId !== loadRequestId.current) return;
          setVisits(result);
          break;
        }
        case "payments": {
          const result = await accountAPI.deals();
          if (requestId !== loadRequestId.current) return;
          setDeals(result);
          break;
        }
        case "messages": {
          const [messages, propertyInquiries] = await Promise.all([
            accountAPI.requests(),
            accountAPI.inquiries(),
          ]);
          if (requestId !== loadRequestId.current) return;
          setRequests(messages);
          setInquiries(propertyInquiries);
          break;
        }
        case "profile": {
          const data = await authAPI.getProfile();
          if (requestId !== loadRequestId.current) return;
          setProfile(data);
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setPhoneNumber(data.phoneNumber || "");
          break;
        }
      }
    } catch (error) {
      if (requestId !== loadRequestId.current) return;
      console.error(`Failed to load account ${activeTab}:`, error);
      toast.error(`Couldn't load your ${activeTab}. Please try again.`);
    } finally {
      if (requestId === loadRequestId.current) setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadAccountSection();
    return () => {
      loadRequestId.current += 1;
    };
  }, [loadAccountSection]);

  const filteredVisits = useMemo(() => {
    if (visitFilter === "all") return visits;
    const today = new Date().toISOString().slice(0, 10);
    return visits.filter(
      (visit) => visit.date >= today && !INACTIVE_VISIT.includes(visit.status),
    );
  }, [visitFilter, visits]);

  const sortedMessages = useMemo(
    () =>
      [
        ...inquiries.map((item) => ({
          id: item.id,
          reference: item.reference,
          status: item.status,
          message: item.message,
          title: item.propertyTitle || "Property inquiry",
          createdAt: item.createdAt,
        })),
        ...requests.map((item) => ({
          id: item.id,
          reference: item.reference,
          status: item.status,
          message: item.message,
          title: statusLabel(item.type),
          createdAt: item.createdAt,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [inquiries, requests],
  );

  const handleSaveDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await authAPI.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      if (response.customer) {
        setProfile(response.customer);
        setCustomer({
          id: response.customer.id,
          email: response.customer.email,
          firstName: response.customer.firstName,
          lastName: response.customer.lastName,
          companyId: response.customer.companyId,
          enabledModules: response.customer.enabledModules,
          emailVerified: response.customer.emailVerified,
          status: response.customer.status,
          phoneNumber: response.customer.phoneNumber,
        });
      }
      toast.success(response.message || "Your details have been saved.");
    } catch (error) {
      console.error("Failed to update account details:", error);
      toast.error("Couldn't save your details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Your new password must be at least 8 characters.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await authAPI.changePassword({ currentPassword, newPassword });
      toast.success(response.message || "Your password has been changed.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      console.error("Failed to change account password:", error);
      toast.error("Couldn't change your password. Check your current password and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    logout();
    toast.success("Signed out successfully.");
    navigate("/");
  };

  const handleRemoveSaved = async (property: Property) => {
    try {
      const updated = await propertiesAPI.unsave(property.id);
      usePropertyStore.setState({
        shortlistedProperties: updated.map((listing) => toProperty(listing)),
      });
      toast.success("Removed from saved properties.");
    } catch (error) {
      console.error("Failed to remove saved property:", error);
      toast.error("Couldn't remove this property. Please try again.");
    }
  };

  const openProperty = (slug: string) => navigate(`/properties/${slug}`);

  const browseButton = (
    <button className={primaryButtonClass} onClick={() => navigate("/properties")}>
      Browse properties
    </button>
  );

  const renderSaved = () => {
    if (!savedProperties.length) {
      return (
        <EmptyState
          icon={<FiHeart size={38} />}
          title="No saved properties yet"
          description="Save properties you love and they’ll be waiting for you here."
          action={browseButton}
        />
      );
    }
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {savedProperties.map((property) => (
          <article key={property.id} className={`${cardClass} overflow-hidden p-0 sm:p-0`}>
            <button
              type="button"
              onClick={() => openProperty(property.slug)}
              className="block h-48 w-full cursor-pointer bg-gray-200 dark:bg-white/5"
              aria-label={`View ${property.name}`}
            >
              {property.img ? (
                <img src={property.img} alt={property.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-gray-500">
                  Property image unavailable
                </span>
              )}
            </button>
            <div className="p-5">
              <p className={`text-xs font-medium ${mutedClass}`}>
                {[property.location.area, property.location.city, property.location.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <button
                type="button"
                onClick={() => openProperty(property.slug)}
                style={SERIF}
                className={`mt-2 cursor-pointer text-left text-lg ${headingClass} hover:text-[#703BF7]`}
              >
                {property.name}
              </button>
              <p className="mt-3 font-semibold text-[#703BF7] dark:text-[#b79bff]">
                {formatMoney(property.pricing.total || property.pricing.base)}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4 text-sm dark:border-white/10">
                <button
                  type="button"
                  onClick={() => openProperty(property.slug)}
                  className="cursor-pointer font-semibold text-[#703BF7] hover:underline dark:text-[#b79bff]"
                >
                  View property
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemoveSaved(property)}
                  className={`cursor-pointer ${mutedClass} hover:text-red-600`}
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderVisits = () => (
    <div>
      <div className="mb-6 inline-flex rounded-full bg-gray-200 p-1 dark:bg-white/10">
        {(["upcoming", "all"] as const).map((filter) => (
          <button
            type="button"
            key={filter}
            onClick={() => setVisitFilter(filter)}
            className={`cursor-pointer rounded-full px-5 py-2 text-sm transition ${
              visitFilter === filter
                ? "bg-white text-gray-900 shadow-sm dark:bg-[#1A1A1A] dark:text-white"
                : `${mutedClass} hover:text-gray-900 dark:hover:text-white`
            }`}
          >
            {filter === "upcoming" ? "Coming up" : "All visits"}
          </button>
        ))}
      </div>
      {filteredVisits.length === 0 ? (
        <EmptyState
          icon={<FiCalendar size={42} />}
          title={visitFilter === "upcoming" ? "No visits coming up" : "No visits yet"}
          description={
            visitFilter === "upcoming"
              ? "Book a visit from any property page."
              : "Your booked property visits will appear here."
          }
          action={browseButton}
        />
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              email={profile?.email || customer?.email || ""}
              onPaymentComplete={() => void loadAccountSection()}
              onVisitUpdated={(updatedVisit) =>
                setVisits((current) =>
                  current.map((item) => (item.id === updatedVisit.id ? updatedVisit : item)),
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderPayments = () => {
    if (!deals.length) {
      return (
        <EmptyState
          icon={<FiDollarSign size={40} />}
          title="No payments yet"
          description="Property payments and receipts will appear here when you make a payment."
          action={browseButton}
        />
      );
    }
    return (
      <div className="w-full space-y-5">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            email={profile?.email || customer?.email || ""}
            onPaymentComplete={() => void loadAccountSection()}
          />
        ))}
      </div>
    );
  };

  const renderMessages = () => {
    if (!sortedMessages.length) {
      return (
        <EmptyState
          icon={<FiMessageSquare size={40} />}
          title="No messages yet"
          description="Your property inquiries and messages to our team will show up here."
          action={
            <button className={primaryButtonClass} onClick={() => navigate("/Contact")}>
              Contact us
            </button>
          }
        />
      );
    }
    return (
      <div className="space-y-4">
        {sortedMessages.map((message) => (
          <article key={message.id} className={cardClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`text-xs ${mutedClass}`}>
                  {message.reference} · {formatDate(message.createdAt)}
                </p>
                <h2 style={SERIF} className={`mt-1 text-lg ${headingClass}`}>
                  {message.title}
                </h2>
              </div>
              <StatusChip status={message.status} />
            </div>
            <p className={`mt-4 whitespace-pre-wrap text-sm leading-6 ${mutedClass}`}>
              {message.message}
            </p>
          </article>
        ))}
      </div>
    );
  };

  const renderProfile = () => (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section className={cardClass}>
        <h2 style={SERIF} className={`mb-5 text-2xl ${headingClass}`}>
          Your details
        </h2>
        <form onSubmit={handleSaveDetails} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <FieldLabel required>First name</FieldLabel>
              <input
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <FieldLabel>Last name</FieldLabel>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <label className="block">
            <FieldLabel>Email</FieldLabel>
            <input
              readOnly
              value={profile?.email || customer?.email || ""}
              className={`${inputClass} bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400`}
            />
            <span className={`mt-1 block text-xs ${mutedClass}`}>
              Contact us if you need to change your email.
            </span>
          </label>
          <label className="block">
            <FieldLabel>Phone</FieldLabel>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="0803 123 4567"
              className={inputClass}
            />
          </label>
          <button className={primaryButtonClass} type="submit" disabled={isSaving}>
            <FiCheck size={16} />
            {isSaving ? "Saving…" : "Save details"}
          </button>
        </form>
      </section>

      <div className="space-y-6">
        <section className={cardClass}>
          <h2 style={SERIF} className={`mb-5 text-2xl ${headingClass}`}>
            Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <label className="block">
              <FieldLabel required>Current password</FieldLabel>
              <input
                required
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Your password"
                className={inputClass}
              />
            </label>
            <label className="block">
              <FieldLabel required>New password</FieldLabel>
              <input
                required
                minLength={8}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                className={inputClass}
              />
              <span className={`mt-1 block text-xs ${mutedClass}`}>At least 8 characters</span>
            </label>
            <button className={primaryButtonClass} type="submit" disabled={isSaving}>
              {isSaving ? "Updating…" : "Change password"}
            </button>
          </form>
        </section>
        <button type="button" onClick={handleSignOut} className={pillButtonClass}>
          <FiLogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="account-page min-h-screen bg-gray-300 text-gray-900 dark:bg-black/30 dark:text-white">
      <Navbar />
      <header className="border-b border-gray-400 dark:border-neutral-800">
        <div className="bg-linear-to-r dark:from-neutral-600/20 from-gray-300/50 dark:to-black/60 to-gray-400 py-5">
          <div className={`${PAGE_CONTAINER} space-y-1`}>
            <p className="text-sm font-semibold text-[#703BF7] dark:text-[#b79bff]">Your account</p>
            <h1 style={SERIF} className="text-4xl font-semibold sm:text-5xl">
              Hello, {customer?.firstName || "there"}
            </h1>
          </div>
        </div>
        <div className={`${PAGE_CONTAINER} pt-8`}>
          {/* The grey baseline is an inset shadow (not a border) so the purple
              underline can sit exactly on top of it, and the scrollbar is hidden. */}
          <nav
            aria-label="Account sections"
            className="flex gap-2 overflow-x-auto shadow-[inset_0_-1px_0_0_rgba(156,163,175,0.6)] [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 dark:shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.1)] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => {
                  if (id === activeTab) return;
                  loadRequestId.current += 1;
                  setIsLoading(true);
                  setActiveTab(id);
                  setSearchParams(id === "profile" ? {} : { tab: id }, { replace: true });
                }}
                aria-current={activeTab === id ? "page" : undefined}
                className={`relative flex shrink-0 cursor-pointer items-center gap-2 px-3 pb-4 text-sm transition after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#703BF7] after:transition-transform sm:px-4 ${
                  activeTab === id
                    ? "font-semibold text-gray-900 after:scale-x-100 dark:text-white"
                    : `after:scale-x-0 ${mutedClass} hover:text-gray-900 dark:hover:text-white`
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="min-h-[55vh] bg-gray-200 py-8 dark:bg-black/50 sm:py-10">
        <div className={PAGE_CONTAINER}>
          {isLoading ? (
            <AccountSkeleton tab={activeTab} />
          ) : activeTab === "saved" ? (
            renderSaved()
          ) : activeTab === "visits" ? (
            renderVisits()
          ) : activeTab === "payments" ? (
            renderPayments()
          ) : activeTab === "messages" ? (
            renderMessages()
          ) : (
            renderProfile()
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountPage;