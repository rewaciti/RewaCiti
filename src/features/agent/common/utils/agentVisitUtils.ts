export const VISITS_PAGE_SIZE = 10;

export type VisitTab =
  | "upcoming"
  | "all"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled";

export const VISIT_STATUS_FILTERS: { value: VisitTab; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "all", label: "All" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { label: "Bank transfer", value: "bank_transfer" },
  { label: "Cash", value: "cash" },
  { label: "POS", value: "pos" },
  { label: "Card", value: "card" },
];

export const VISIT_STATUS_PILL_CLASSES: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  pending_confirmation: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  no_show: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
};

export const PAYMENT_STATUS_PILL_CLASSES: Record<string, string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  unpaid: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  void: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
};

export const visitStatusPillClass = (status: string) =>
  `inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${VISIT_STATUS_PILL_CLASSES[status] ?? VISIT_STATUS_PILL_CLASSES.cancelled}`;

export const paymentStatusPillClass = (status: string) =>
  `inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${PAYMENT_STATUS_PILL_CLASSES[status] ?? PAYMENT_STATUS_PILL_CLASSES.unpaid}`;

export const visitStatusLabel = (status: string) => {
  if (status === "pending_payment") return "Pending payment";
  if (status === "pending_confirmation") return "Awaiting confirmation";
  if (status === "no_show") return "No show";
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const formatVisitTime = (time?: string | null) => {
  if (!time) return "—";
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time;
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
};

export const formatVisitDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  const parsed = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatVisitDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
