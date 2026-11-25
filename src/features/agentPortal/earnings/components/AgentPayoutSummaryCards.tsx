import { CheckCircle2, CircleSlash2, Clock3 } from "lucide-react";
import type { AgentPayoutSummary } from "@/features/agentPortal/common/services/agentAPI";
import { money } from "@/features/agentPortal/common/utils/agentListingUtils";

interface AgentPayoutSummaryCardsProps {
  summary: AgentPayoutSummary | null;
}

const cards = [
  { key: "pending", label: "Pending", icon: Clock3, tone: "text-amber-600 dark:text-amber-300" },
  { key: "paid", label: "Paid", icon: CheckCircle2, tone: "text-green-600 dark:text-green-300" },
  { key: "void", label: "Void", icon: CircleSlash2, tone: "text-gray-600 dark:text-gray-300" },
] as const;

const AgentPayoutSummaryCards = ({ summary }: AgentPayoutSummaryCardsProps) => (
  <section className="grid grid-cols-1 gap-3 xl:grid-cols-3" aria-label="Payout summary">
    {cards.map(({ key, label, icon: Icon, tone }) => {
      const bucket = summary?.[key];
      return (
        <article key={key} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-neutral-900">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            <Icon size={18} className={tone} aria-hidden="true" />
          </div>
          <p className="m-0 mt-3 font-serif text-2xl font-semibold text-gray-900 dark:text-white">
            {money(Number(bucket?.amount) || 0)}
          </p>
          <p className="m-0 mt-1 text-xs text-gray-600 dark:text-gray-400">
            {bucket?.count ?? 0} {bucket?.count === 1 ? "payout" : "payouts"}
          </p>
        </article>
      );
    })}
  </section>
);

export default AgentPayoutSummaryCards;
