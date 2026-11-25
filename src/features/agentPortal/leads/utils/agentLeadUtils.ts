import type { AgentInquiryStatus } from "@/features/agentPortal/common/services/agentAPI";

export const LEADS_PAGE_SIZE = 10;

export type LeadTab = "all" | AgentInquiryStatus;

export const LEAD_STATUS_FILTERS: { value: LeadTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed_won", label: "Closed won" },
  { value: "closed_lost", label: "Closed lost" },
];

export const LEAD_STATUS_OPTIONS: { value: AgentInquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed_won", label: "Closed won" },
  { value: "closed_lost", label: "Closed lost" },
];

export const LEAD_STATUS_PILL_CLASSES: Record<AgentInquiryStatus, string> = {
  new: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  qualified: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  closed_won: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  closed_lost: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
};

export const leadStatusPillClass = (status: AgentInquiryStatus) =>
  `inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${LEAD_STATUS_PILL_CLASSES[status] ?? LEAD_STATUS_PILL_CLASSES.new}`;

export const leadStatusLabel = (status: string) => {
  const found = LEAD_STATUS_OPTIONS.find((option) => option.value === status);
  if (found) return found.label;
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const formatLeadDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatLeadDate = (iso?: string | null) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
