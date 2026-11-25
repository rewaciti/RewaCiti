import type {
  AgentDeal,
  AgentPayout,
  AgentPayoutFilter,
  AgentPayoutFilterOption,
} from "@/features/agentPortal/common/services/agentAPI";
import { money } from "@/features/agentPortal/common/utils/agentListingUtils";

export const PAYOUTS_PAGE_SIZE = 10;
export const DEALS_PAGE_SIZE = 10;

export type EarningsTab = "payout" | "deals" | "visit_fee";

export const EARNINGS_TABS: { value: EarningsTab; label: string }[] = [
  { value: "payout", label: "Payout" },
  { value: "deals", label: "Deals" },
  { value: "visit_fee", label: "Visit fee" },
];

export type PayoutStatus = "" | "pending" | "paid" | "void";

export const PAYOUT_STATUS_OPTIONS: { value: PayoutStatus; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

export type DealStatus = "" | "open" | "won" | "lost";

export const DEAL_STATUS_OPTIONS: { value: DealStatus; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const VISIT_FEE_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "pending_confirmation", label: "Awaiting confirmation" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

const PILL_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  void: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-400",
};

const titleCase = (value: string) =>
  value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const payoutStatusLabel = (status: string) => titleCase(status || "Unknown");

export const payoutStatusPillClass = (status: string) =>
  `inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${PILL_CLASSES[status] ?? PILL_CLASSES.pending}`;

const DEAL_PILL_CLASSES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  won: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  lost: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-400",
};

export const dealStatusLabel = (status: string) => titleCase(status || "Unknown");

export const dealStatusPillClass = (status: string) =>
  `inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${DEAL_PILL_CLASSES[status] ?? DEAL_PILL_CLASSES.open}`;

export const dealPropertyTitle = (deal: AgentDeal) =>
  deal.property?.title || deal.property?.sku || "—";

export const dealCustomerName = (deal: AgentDeal) => deal.customer?.name || "—";

export const dealAmount = (deal: AgentDeal) => money(Number(deal.amount) || 0);

export const formatPayoutDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDealDate = formatPayoutDate;

export const payoutReference = (payout: AgentPayout) =>
  payout.reference || payout.dealId || payout.id.slice(0, 8).toUpperCase();

export const payoutDescription = (payout: AgentPayout) =>
  payout.description || payout.method || "Commission payout";

export const payoutPropertyTitle = (payout: AgentPayout) =>
  payout.property?.title || payout.propertyTitle || payout.property?.sku || payout.propertySku || "—";

export const payoutAmount = (payout: AgentPayout) =>
  money(Number(payout.amount) || 0, payout.currency || "NGN");

export interface NormalizedPayoutFilter {
  id: string;
  field: string;
  label: string;
  options: AgentPayoutFilterOption[];
}

const normalizeOption = (raw: unknown): AgentPayoutFilterOption | null => {
  if (typeof raw === "string" || typeof raw === "number") {
    return { label: titleCase(String(raw)), value: String(raw) };
  }
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const value = record.value ?? record.key ?? record.id ?? record.name;
  const label = record.label ?? record.name ?? record.value ?? record.key ?? record.id;
  if (value === undefined || value === null || value === "") return null;
  return { label: titleCase(String(label)), value: String(value) };
};

export const normalizeFilterOptions = (filters: AgentPayoutFilter[]): NormalizedPayoutFilter[] =>
  filters.flatMap((filter, index) => {
    const field = filter.field ?? filter.key ?? filter.name ?? "";
    if (!field || field === "status") return [];

    const labels = filter.options ?? filter.values ?? [];
    const options = labels.map(normalizeOption).filter((option): option is AgentPayoutFilterOption => option !== null);
    if (!options.length) return [];

    return [{
      id: `${field}-${index}`,
      field,
      label: filter.label ?? filter.name ?? titleCase(field),
      options,
    }];
  });
