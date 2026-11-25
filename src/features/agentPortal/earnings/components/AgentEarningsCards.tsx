import { CheckCircle2, Clock3, Percent, Star } from "lucide-react";
import type { AgentPayoutSummary, AgentRatingSummary } from "@/features/agentPortal/common/services/agentAPI";
import { compactMoney } from "@/features/agentPortal/common/utils/agentListingUtils";

interface AgentEarningsCardsProps {
  summary: AgentPayoutSummary | null;
  commissionPercent?: number;
  rating: AgentRatingSummary | null;
}

const cardClass = "rounded-xl border border-gray-200 bg-white p-3 sm:p-4 dark:border-white/10 dark:bg-neutral-900";
const labelClass = "m-0 text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300";
const valueClass = "m-0 mt-2 font-serif text-xl font-semibold text-gray-900 sm:mt-3 sm:text-2xl dark:text-white";
const noteClass = "m-0 mt-1 text-xs text-gray-600 dark:text-gray-400";

const AgentEarningsCards = ({ summary, commissionPercent, rating }: AgentEarningsCardsProps) => {
  const waiting = Number(summary?.pending.count) || 0;
  const average = Number(rating?.average) || 0;
  const reviews = Number(rating?.count) || 0;
  const filledStars = Math.max(0, Math.min(5, Math.round(average)));

  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Earnings summary">
      <article className={cardClass}>
        <div className="flex items-center justify-between gap-2">
          <p className={labelClass}>To be paid</p>
          <Clock3 size={18} className="text-amber-600 dark:text-amber-300" aria-hidden="true" />
        </div>
        <p className={valueClass}>{compactMoney(Number(summary?.pending.amount) || 0)}</p>
        <p className={noteClass}>{waiting} waiting</p>
      </article>

      <article className={cardClass}>
        <div className="flex items-center justify-between gap-2">
          <p className={labelClass}>Paid to you</p>
          <CheckCircle2 size={18} className="text-green-600 dark:text-green-300" aria-hidden="true" />
        </div>
        <p className={valueClass}>{compactMoney(Number(summary?.paid.amount) || 0)}</p>
        <p className={noteClass}>Completed payouts</p>
      </article>

      <article className={cardClass}>
        <div className="flex items-center justify-between gap-2">
          <p className={labelClass}>Commission rate</p>
          <Percent size={18} className="text-brand dark:text-brand-light" aria-hidden="true" />
        </div>
        <p className={valueClass}>{Number(commissionPercent) || 0}%</p>
        <p className={noteClass}>Per successful deal</p>
      </article>

      <article className={cardClass}>
        <div className="flex items-center justify-between gap-2">
          <p className={labelClass}>Your rating</p>
          <Star size={18} className="fill-amber-400 text-amber-400" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-center gap-1 sm:mt-3 sm:gap-2">
          <strong className="font-serif text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">{average.toFixed(1)}</strong>
          <div className="flex items-center gap-0.5" aria-label={`${average.toFixed(1)} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                size={12}
                className={index < filledStars ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
        <p className={noteClass}>{reviews} {reviews === 1 ? "review" : "reviews"}</p>
      </article>
    </section>
  );
};

export default AgentEarningsCards;
